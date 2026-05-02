import { getLesson } from "@/lib/curriculum";
import { json, publicSession } from "@/lib/api";
import { getSession } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) return json({ error: "Session not found" }, 404);
  return json({ ...publicSession(session), lesson: getLesson(session.lessonId) });
}
