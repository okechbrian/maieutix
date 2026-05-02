import { json } from "@/lib/api";
import { getSession } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) return json({ error: "Session not found" }, 404);
  const canEdit = ["approved", "editing", "submitted", "reflecting"].includes(session.currentPhase);
  return json({
    can_edit: canEdit,
    canEdit,
    reason: canEdit ? "Editor unlocked" : "Write and approve your spec before coding",
  });
}
