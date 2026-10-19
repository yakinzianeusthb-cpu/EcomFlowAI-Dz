import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, SessionPayload } from "../lib/session";
import { createRateLimiter } from "../lib/rateLimit";
import { ASSET_META, SERVER_ERROR, UUID, accountKey } from "../lib/routeHelpers";
import { hasPaidAccess, withAccountLock } from "../lib/accountLimits";
import { connectionClient } from "../lib/metaAccount";
import {
  MAX_PROJECTS_PER_USER,
  MAX_VERSIONS_PER_OUTPUT,
  OUTPUT_KINDS,
  OUTPUT_STORAGE_BYTES,
  PROJECT_ERRORS,
  parseOutputInput,
  parseProjectInput,
  type OutputKind,
} from "../lib/projectRules";

/**
 * Campaign projects: a product brief, its photos (see routes/assets.ts) and the versioned outputs generated
 * from it. Every query is scoped to the signed-in user: an id from another account answers 404.
 */
const router = Router();

const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 60, keyFn: accountKey });

function ownedProject(id: string, userId: string) {
  if (!UUID.test(id)) return Promise.resolve(null);
  return prisma.project.findFirst({ where: { id, userId } });
}

// GET /api/projects — the user's campaigns, latest first, with a cover photo and what has been generated.
router.get("/api/projects", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  try {
    const [projects, latest] = await Promise.all([
      prisma.project.findMany({
        where: { userId: user.sub },
        orderBy: { updatedAt: "desc" },
        take: MAX_PROJECTS_PER_USER,
        include: {
          assets: { where: { kind: "product" }, select: { id: true }, orderBy: { createdAt: "asc" }, take: 1 },
          _count: { select: { assets: true } },
        },
      }),
      prisma.projectOutput.groupBy({
        by: ["projectId", "kind"],
        where: { userId: user.sub },
        _max: { version: true, createdAt: true },
      }),
    ]);
    const outputsByProject = new Map<string, Record<string, { version: number; at: Date | null }>>();
    for (const row of latest) {
      const entry = outputsByProject.get(row.projectId) ?? {};
      entry[row.kind] = { version: row._max.version ?? 0, at: row._max.createdAt };
      outputsByProject.set(row.projectId, entry);
    }
    res.json(
      projects.map(({ assets, _count, ...p }) => ({
        ...p,
        coverAssetId: assets[0]?.id ?? null,
        assetCount: _count.assets,
        outputs: outputsByProject.get(p.id) ?? {},
      })),
    );
  } catch (err) {
    console.error("List projects error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// POST /api/projects — start a campaign from a brief.
router.post("/api/projects", requireAuth, writeLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const parsed = parseProjectInput(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  try {
    const project = await withAccountLock(user.sub, async (tx) => {
      if ((await tx.project.count({ where: { userId: user.sub } })) >= MAX_PROJECTS_PER_USER) return null;
      return tx.project.create({ data: { ...parsed.data, name: parsed.data.name!, userId: user.sub } });
    });
    if (!project) return res.status(400).json({ error: PROJECT_ERRORS.limit });
    res.status(201).json(project);
  } catch (err) {
    console.error("Create project error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// GET /api/projects/:id — the brief, its files and the latest version of each output, plus the version list.
router.get("/api/projects/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  try {
    const project = await ownedProject(req.params.id as string, user.sub);
    if (!project) return res.status(404).json({ error: PROJECT_ERRORS.notFound });
    const [assets, versions] = await Promise.all([
      prisma.asset.findMany({ where: { projectId: project.id, userId: user.sub }, select: ASSET_META, orderBy: { createdAt: "asc" } }),
      prisma.projectOutput.findMany({
        where: { projectId: project.id, userId: user.sub },
        select: { id: true, kind: true, version: true, createdAt: true },
        orderBy: { version: "desc" },
      }),
    ]);
    const latestIds = OUTPUT_KINDS.map((kind) => versions.find((v) => v.kind === kind)?.id).filter((id): id is string => Boolean(id));
    const latest = latestIds.length ? await prisma.projectOutput.findMany({ where: { id: { in: latestIds } } }) : [];
    const outputs: Partial<Record<OutputKind, { id: string; version: number; createdAt: Date; data: unknown }>> = {};
    for (const o of latest) outputs[o.kind as OutputKind] = { id: o.id, version: o.version, createdAt: o.createdAt, data: o.data };
    res.json({ project, assets, outputs, versions });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// PATCH /api/projects/:id — edit the brief (only the fields that are sent).
router.patch("/api/projects/:id", requireAuth, writeLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const parsed = parseProjectInput(req.body, { partial: true });
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  try {
    const project = await ownedProject(req.params.id as string, user.sub);
    if (!project) return res.status(404).json({ error: PROJECT_ERRORS.notFound });
    const updated = await prisma.project.update({ where: { id: project.id }, data: parsed.data });
    res.json(updated);
  } catch (err) {
    console.error("Update project error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

/**
 * Pauses every Meta campaign of the project whose latest record says it may be running. False when one of them
 * cannot be paused (no Meta connection, or Meta refused), so the caller can refuse to delete.
 */
async function pauseMetaCampaigns(projectId: string, userId: string): Promise<boolean> {
  const records = await prisma.projectOutput.findMany({ where: { projectId, userId, kind: "meta_campaign" }, orderBy: { version: "desc" }, select: { data: true } });
  const latest = new Map<string, unknown>();
  for (const r of records) {
    const data = r.data as { campaignId?: unknown; status?: unknown } | null;
    if (data && typeof data.campaignId === "string" && !latest.has(data.campaignId)) latest.set(data.campaignId, data.status);
  }
  const running = [...latest].filter(([, status]) => status !== "PAUSED").map(([id]) => id);
  if (!running.length) return true;
  if (!running.every((id) => /^\d{5,25}$/.test(id))) return false;
  const meta = await connectionClient(userId);
  if ("error" in meta) return false;
  const results = await Promise.all(running.map((id) => meta.client.post(id, { status: "PAUSED" }).then(() => true, () => false)));
  return results.every(Boolean);
}

// DELETE /api/projects/:id — the project, its saved versions and its files. A Meta campaign that may still be
// running is paused first; if that fails the delete is refused, unless ?force=1 says the user knows it keeps running.
router.delete("/api/projects/:id", requireAuth, writeLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  try {
    const project = await ownedProject(req.params.id as string, user.sub);
    if (!project) return res.status(404).json({ error: PROJECT_ERRORS.notFound });
    if (req.query.force !== "1" && !(await pauseMetaCampaigns(project.id, user.sub))) {
      return res.status(409).json({ error: PROJECT_ERRORS.metaActive, code: "META_ACTIVE" });
    }
    const files = await prisma.asset.findMany({ where: { projectId: project.id, userId: user.sub }, select: { id: true } });
    const fileIds = files.map((f) => f.id);
    await prisma.$transaction([
      // a file of this project may be the brand logo: never leave the kit pointing at a deleted file
      prisma.brandKit.updateMany({ where: { userId: user.sub, logoAssetId: { in: fileIds } }, data: { logoAssetId: null } }),
      prisma.asset.deleteMany({ where: { id: { in: fileIds }, userId: user.sub } }),
      prisma.project.delete({ where: { id: project.id } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// GET /api/projects/:id/outputs/:kind/:version — an older version, to compare or restore.
router.get("/api/projects/:id/outputs/:kind/:version", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const version = Number(req.params.version);
  if (!(OUTPUT_KINDS as readonly string[]).includes(req.params.kind as string) || !Number.isInteger(version) || version < 1) {
    return res.status(400).json({ error: PROJECT_ERRORS.outputKind });
  }
  try {
    const project = await ownedProject(req.params.id as string, user.sub);
    if (!project) return res.status(404).json({ error: PROJECT_ERRORS.notFound });
    const output = await prisma.projectOutput.findFirst({ where: { projectId: project.id, userId: user.sub, kind: req.params.kind as string, version } });
    if (!output) return res.status(404).json({ error: PROJECT_ERRORS.notFound });
    res.json({ id: output.id, kind: output.kind, version: output.version, createdAt: output.createdAt, data: output.data });
  } catch (err) {
    console.error("Get output version error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

// POST /api/projects/:id/outputs — save a newly generated (or edited) output as the next version.
router.post("/api/projects/:id/outputs", requireAuth, writeLimiter, async (req, res) => {
  const user = req.user as SessionPayload;
  const parsed = parseOutputInput(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  try {
    const project = await ownedProject(req.params.id as string, user.sub);
    if (!project) return res.status(404).json({ error: PROJECT_ERRORS.notFound });
    const quota = (await hasPaidAccess(user.sub)) ? OUTPUT_STORAGE_BYTES.paid : OUTPUT_STORAGE_BYTES.free;

    // under the account lock, the quota check, the version number and the insert cannot interleave with another save
    const saved = await withAccountLock(user.sub, async (tx) => {
      const used = await tx.projectOutput.aggregate({ where: { userId: user.sub }, _sum: { size: true } });
      if ((used._sum.size ?? 0) + parsed.bytes > quota) return null;
      const last = await tx.projectOutput.findFirst({ where: { projectId: project.id, kind: parsed.kind }, orderBy: { version: "desc" }, select: { version: true } });
      const version = (last?.version ?? 0) + 1;
      const created = await tx.projectOutput.create({
        data: { projectId: project.id, userId: user.sub, kind: parsed.kind, version, data: parsed.data as object, size: parsed.bytes },
        select: { id: true, kind: true, version: true, createdAt: true },
      });
      await tx.projectOutput.deleteMany({ where: { projectId: project.id, kind: parsed.kind, version: { lte: version - MAX_VERSIONS_PER_OUTPUT } } });
      await tx.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });
      return created;
    });
    if (!saved) return res.status(413).json({ error: PROJECT_ERRORS.storageFull });
    res.status(201).json(saved);
  } catch (err) {
    console.error("Save output error:", err);
    res.status(500).json({ error: SERVER_ERROR });
  }
});

export const projectsRouter = router;
