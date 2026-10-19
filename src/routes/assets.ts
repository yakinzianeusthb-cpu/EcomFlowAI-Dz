import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, SessionPayload } from "../lib/session";
import { createRateLimiter } from "../lib/rateLimit";
import { ASSET_META, SERVER_ERROR, UUID, accountKey } from "../lib/routeHelpers";
import type { Prisma } from "@prisma/client";
import { hasPaidAccess, withAccountLock } from "../lib/accountLimits";
import { ASSET_ERRORS, ASSET_KINDS, MAX_ASSETS_PER_PROJECT, STORAGE_BYTES, parseAssetInput } from "../lib/assetRules";

/**
 * The asset library: images stored in the database and served only to their owner, with their sniffed type,
 * `nosniff` and a sandboxing CSP, so a stored file can never run as a page on this origin.
 */
const router = Router();

const PAGE_SIZE = 60;

const uploadLimiter = createRateLimiter({ windowMs: 60_000, max: 40, keyFn: accountKey, message: "Trop d'envois. Réessaie dans une minute." });

async function storageUsed(userId: string, db: Prisma.TransactionClient = prisma): Promise<number> {
  const agg = await db.asset.aggregate({ where: { userId }, _sum: { size: true } });
  return agg._sum.size ?? 0;
}

const storageQuota = async (userId: string) => ((await hasPaidAccess(userId)) ? STORAGE_BYTES.paid : STORAGE_BYTES.free);

// GET /api/assets — the library, newest first; filter by kind, project or name, paged with ?cursor=.
router.get("/api/assets", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const kind = typeof req.query.kind === "string" && (ASSET_KINDS as readonly string[]).includes(req.query.kind) ? req.query.kind : undefined;
  const projectId = typeof req.query.projectId === "string" && UUID.test(req.query.projectId) ? req.query.projectId : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  const cursorId = typeof req.query.cursor === "string" && UUID.test(req.query.cursor) ? req.query.cursor : undefined;
  try {
    // a cursor must be one of the user's own files, or the page would start from someone else's
    const cursor = cursorId && (await prisma.asset.findFirst({ where: { id: cursorId, userId: user.sub }, select: { id: true } })) ? cursorId : undefined;
    const [items, used, quota] = await Promise.all([
      prisma.asset.findMany({
        where: { userId: user.sub, ...(kind && { kind }), ...(projectId && { projectId }), ...(q && { name: { contains: q, mode: "insensitive" as const } }) },
        select: { ...ASSET_META, project: { select: { name: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      }),
      storageUsed(user.sub),
      storageQuota(user.sub),
    ]);
    const hasMore = items.length > PAGE_SIZE;
    const page = items.slice(0, PAGE_SIZE).map(({ project, ...a }) => ({ ...a, projectName: project?.name ?? null }));
    res.json({ items: page, nextCursor: hasMore ? page[page.length - 1].id : null, storage: { used, quota } });
  } catch (err) {
    console.error("List assets error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// POST /api/assets — store an image (sent as a data URL after the browser has compressed it).
router.post("/api/assets", requireAuth, uploadLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const parsed = parseAssetInput(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  try {
    if (parsed.projectId) {
      const project = await prisma.project.findFirst({ where: { id: parsed.projectId, userId: user.sub }, select: { id: true } });
      if (!project) return res.status(404).json({ error: ASSET_ERRORS.project });
    }
    const quota = await storageQuota(user.sub);
    // the counts, the quota and the insert run under the account lock, so parallel uploads cannot overshoot
    const result = await withAccountLock(user.sub, async (tx) => {
      if (parsed.projectId && (await tx.asset.count({ where: { projectId: parsed.projectId } })) >= MAX_ASSETS_PER_PROJECT) return { status: 400, error: ASSET_ERRORS.projectFull } as const;
      if ((await storageUsed(user.sub, tx)) + parsed.bytes.length > quota) return { status: 413, error: ASSET_ERRORS.quota } as const;
      const asset = await tx.asset.create({
        data: {
          userId: user.sub,
          projectId: parsed.projectId,
          kind: parsed.kind,
          name: parsed.name,
          mimeType: parsed.mimeType,
          size: parsed.bytes.length,
          width: parsed.width,
          height: parsed.height,
          data: parsed.bytes,
        },
        select: ASSET_META,
      });
      return { asset };
    });
    if ("error" in result) return res.status(result.status).json({ error: result.error });
    if (parsed.projectId) await prisma.project.update({ where: { id: parsed.projectId }, data: { updatedAt: new Date() } });
    res.status(201).json(result.asset);
  } catch (err) {
    console.error("Upload asset error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// GET /api/assets/:id/file — the image itself (?download=1 to save it). Assets never change, so it caches forever.
router.get("/api/assets/:id/file", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  if (!UUID.test(id)) return res.status(404).json({ error: ASSET_ERRORS.notFound });
  try {
    const asset = await prisma.asset.findFirst({ where: { id, userId: user.sub }, select: { data: true, mimeType: true, name: true } });
    if (!asset) return res.status(404).json({ error: ASSET_ERRORS.notFound });
    const bytes = Buffer.from(asset.data);
    const disposition = req.query.download === "1" ? "attachment" : "inline";
    res.setHeader("Content-Type", asset.mimeType);
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("Content-Disposition", `${disposition}; filename="asset"; filename*=UTF-8''${encodeURIComponent(asset.name)}`);
    res.end(bytes);
  } catch (err) {
    console.error("Get asset file error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// POST /api/assets/:id/copy — reuse one of the user's images in a project (a copy, so each project owns its files).
router.post("/api/assets/:id/copy", requireAuth, uploadLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  const projectId = req.body?.projectId;
  if (!UUID.test(id)) return res.status(404).json({ error: ASSET_ERRORS.notFound });
  if (typeof projectId !== "string" || !UUID.test(projectId)) return res.status(404).json({ error: ASSET_ERRORS.project });
  try {
    const [source, project] = await Promise.all([
      prisma.asset.findFirst({ where: { id, userId: user.sub } }),
      prisma.project.findFirst({ where: { id: projectId, userId: user.sub }, select: { id: true } }),
    ]);
    if (!source) return res.status(404).json({ error: ASSET_ERRORS.notFound });
    if (!project) return res.status(404).json({ error: ASSET_ERRORS.project });
    const quota = await storageQuota(user.sub);
    const result = await withAccountLock(user.sub, async (tx) => {
      if ((await tx.asset.count({ where: { projectId } })) >= MAX_ASSETS_PER_PROJECT) return { status: 400, error: ASSET_ERRORS.projectFull } as const;
      if ((await storageUsed(user.sub, tx)) + source.size > quota) return { status: 413, error: ASSET_ERRORS.quota } as const;
      const asset = await tx.asset.create({
        data: { userId: user.sub, projectId, kind: source.kind === "logo" ? "other" : source.kind, name: source.name, mimeType: source.mimeType, size: source.size, width: source.width, height: source.height, data: source.data },
        select: ASSET_META,
      });
      return { asset };
    });
    if ("error" in result) return res.status(result.status).json({ error: result.error });
    await prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } });
    res.status(201).json(result.asset);
  } catch (err) {
    console.error("Copy asset error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// DELETE /api/assets/:id — remove a file (and unset it as the brand logo if it was).
router.delete("/api/assets/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  if (!UUID.test(id)) return res.status(404).json({ error: ASSET_ERRORS.notFound });
  try {
    const removed = await prisma.asset.deleteMany({ where: { id, userId: user.sub } });
    if (removed.count === 0) return res.status(404).json({ error: ASSET_ERRORS.notFound });
    await prisma.brandKit.updateMany({ where: { userId: user.sub, logoAssetId: id }, data: { logoAssetId: null } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete asset error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

export const assetsRouter = router;
