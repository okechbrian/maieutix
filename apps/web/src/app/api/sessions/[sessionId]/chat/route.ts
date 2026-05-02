import { createCoachReply } from "@/lib/aiCoach";
import { json, readJson } from "@/lib/api";
import { getSession, updateSession } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (!getSession(sessionId)) return json({ error: "Session not found" }, 404);
  const body = await readJson<{ message?: string }>(request);
  if (!body.message?.trim()) return json({ error: "message is required" }, 400);
  const reply = await createCoachReply(sessionId, body.message);
  if (reply.includes("[SPEC_APPROVED]")) {
    updateSession(sessionId, { currentPhase: "approved" });
  }
  return json({ reply });
}
