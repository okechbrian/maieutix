import { json, publicSession, readJson } from "@/lib/api";
import { addDialogueTurn, getSession, updateSession } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  if (!(await getSession(sessionId))) return json({ error: "Session not found" }, 404);
  const body = await readJson<{ specText?: string; spec_text?: string }>(request);
  const specText = body.specText ?? body.spec_text ?? "";
  if (specText.trim().length < 20) {
    return json({ error: "Spec must describe the program in at least 20 characters" }, 400);
  }
  const session = await updateSession(sessionId, { specText, currentPhase: "spec" });
  await addDialogueTurn(sessionId, "student", `Spec draft: ${specText}`);
  await addDialogueTurn(sessionId, "coach", "What are the inputs, main steps, and final output in that spec? Once those are clear, approve it and start coding.");
  return json(publicSession(session));
}
