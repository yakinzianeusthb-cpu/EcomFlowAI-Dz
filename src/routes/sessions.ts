import express, { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, SessionPayload } from "../lib/session";
import { SAVED_WORK_ERRORS, SAVED_WORK_LIMITS, jsonBytes, validTitle } from "../lib/savedWork";

/** Why a session body cannot be stored (null when it can): its title and the size of its content. */
function sessionProblem(b: Record<string, unknown>, field: "state" | "messages", maxBytes: number): { status: number; error: string } | null {
  if (!validTitle(b.title)) return { status: 400, error: SAVED_WORK_ERRORS.invalid };
  if (b[field] !== undefined && jsonBytes(b[field]) > maxBytes) return { status: 413, error: SAVED_WORK_ERRORS.tooBig };
  return null;
}

const router = Router();

// ---- LP sessions -----------------------------------------------------------

// GET /api/lp-sessions — list the user's landing-page editor sessions.
router.get("/api/lp-sessions", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const sessions = await prisma.lpSession.findMany({
    where: { userId: user.sub },
    orderBy: { updatedAt: "desc" },
  });
  res.json(sessions);
});

// POST /api/lp-sessions — create an LP session (req.body: title, state).
router.post("/api/lp-sessions", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const b = req.body || {};
  const problem = sessionProblem(b, "state", SAVED_WORK_LIMITS.lpStateBytes);
  if (problem) return res.status(problem.status).json({ error: problem.error });
  if ((await prisma.lpSession.count({ where: { userId: user.sub } })) >= SAVED_WORK_LIMITS.sessionsPerAccount) {
    return res.status(400).json({ error: SAVED_WORK_ERRORS.tooMany });
  }
  const session = await prisma.lpSession.create({
    data: { userId: user.sub, title: b.title, state: b.state ?? {} },
  });
  res.json(session);
});

// PUT /api/lp-sessions/:id — update an LP session owned by the user.
router.put("/api/lp-sessions/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  const problem = sessionProblem(req.body || {}, "state", SAVED_WORK_LIMITS.lpStateBytes);
  if (problem) return res.status(problem.status).json({ error: problem.error });
  const existing = await prisma.lpSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.sub) {
    return res.status(404).json({ error: "Session introuvable." });
  }
  const b = req.body || {};
  const data: any = {};
  if (b.title !== undefined) data.title = b.title;
  if (b.state !== undefined) data.state = b.state;
  const session = await prisma.lpSession.update({ where: { id }, data });
  res.json(session);
});

// DELETE /api/lp-sessions/:id — delete an LP session owned by the user.
router.delete("/api/lp-sessions/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  const existing = await prisma.lpSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.sub) {
    return res.status(404).json({ error: "Session introuvable." });
  }
  await prisma.lpSession.delete({ where: { id } });
  res.json({ ok: true });
});

// ---- Chat sessions -----------------------------------------------------------

// GET /api/chat-sessions — list the user's expert-chat sessions.
router.get("/api/chat-sessions", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const sessions = await prisma.chatSession.findMany({
    where: { userId: user.sub },
    orderBy: { updatedAt: "desc" },
  });
  res.json(sessions);
});

// POST /api/chat-sessions — create a chat session (req.body: title, messages).
router.post("/api/chat-sessions", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const b = req.body || {};
  const problem = sessionProblem(b, "messages", SAVED_WORK_LIMITS.chatMessagesBytes);
  if (problem) return res.status(problem.status).json({ error: problem.error });
  if ((await prisma.chatSession.count({ where: { userId: user.sub } })) >= SAVED_WORK_LIMITS.sessionsPerAccount) {
    return res.status(400).json({ error: SAVED_WORK_ERRORS.tooMany });
  }
  const session = await prisma.chatSession.create({
    data: { userId: user.sub, title: b.title, messages: b.messages ?? [] },
  });
  res.json(session);
});

// PUT /api/chat-sessions/:id — update a chat session owned by the user.
router.put("/api/chat-sessions/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  const problem = sessionProblem(req.body || {}, "messages", SAVED_WORK_LIMITS.chatMessagesBytes);
  if (problem) return res.status(problem.status).json({ error: problem.error });
  const existing = await prisma.chatSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.sub) {
    return res.status(404).json({ error: "Session introuvable." });
  }
  const b = req.body || {};
  const data: any = {};
  if (b.title !== undefined) data.title = b.title;
  if (b.messages !== undefined) data.messages = b.messages;
  const session = await prisma.chatSession.update({ where: { id }, data });
  res.json(session);
});

// DELETE /api/chat-sessions/:id — delete a chat session owned by the user.
router.delete("/api/chat-sessions/:id", requireAuth, async (req, res) => {
  const user = req.user as SessionPayload;
  const id = req.params.id as string;
  const existing = await prisma.chatSession.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.sub) {
    return res.status(404).json({ error: "Session introuvable." });
  }
  await prisma.chatSession.delete({ where: { id } });
  res.json({ ok: true });
});

export const sessionsRouter = router;
