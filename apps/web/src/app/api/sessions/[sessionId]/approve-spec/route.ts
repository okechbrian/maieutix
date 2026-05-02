import { json, publicSession } from "@/lib/api";
import { evaluateSpecQuality } from "@/lib/maieutic";
import { addDialogueTurn, getSession, updateSession } from "@/lib/store";

export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) return json({ error: "Session not found" }, 404);
  if (!session.specText) return json({ error: "Save a spec before approving" }, 400);
  const quality = await evaluateSpecQuality(session.specText);
  if (!quality.approved) {
    const message = `Spec is not ready yet. ${quality.missing.join(" ")}`;
    await addDialogueTurn(sessionId, "coach", message);
    return json({ error: message, missing: quality.missing }, 400);
  }
  const updated = await updateSession(sessionId, { currentPhase: "approved" });
  await addDialogueTurn(sessionId, "coach", `[SPEC_APPROVED] ${quality.summary}`);
  return json(publicSession(updated));
}
