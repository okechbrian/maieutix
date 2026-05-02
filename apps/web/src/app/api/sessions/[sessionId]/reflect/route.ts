import { json, publicSession, readJson } from "@/lib/api";
import { addReflectionScore, getSession, updateSession } from "@/lib/store";

function scoreReflection(text: string) {
  let score = 2;
  if (text.length > 80) score += 1;
  if (/because|i learned|next time|bug|test|changed/i.test(text)) score += 1;
  if (/spec|input|output|condition|loop|function|list/i.test(text)) score += 1;
  return Math.min(score, 5);
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) return json({ error: "Session not found" }, 404);
  const body = await readJson<{ reflectionText?: string; reflection_text?: string }>(request);
  const reflectionText = body.reflectionText ?? body.reflection_text ?? "";
  if (reflectionText.trim().length < 20) return json({ error: "Reflection must be at least 20 characters" }, 400);
  const score = scoreReflection(reflectionText);
  const message = score >= 4 ? "Strong reflection with clear evidence." : "Add more detail about what changed and why.";
  await addReflectionScore(sessionId, score, message);
  const updated = await updateSession(sessionId, { reflectionText, reflectionScore: score, currentPhase: "complete" });
  return json({ ...publicSession(updated), score, message });
}
