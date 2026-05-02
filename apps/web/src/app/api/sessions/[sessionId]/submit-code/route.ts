import { getLesson } from "@/lib/curriculum";
import { json, publicSession, readJson } from "@/lib/api";
import { buildGapAnalysis } from "@/lib/maieutic";
import { addSubmission, getSession, updateSession } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) return json({ error: "Session not found" }, 404);
  if (!["approved", "editing", "reflecting", "submitted"].includes(session.currentPhase)) {
    return json({ error: "Code cannot be submitted before the specification is approved." }, 409);
  }
  const body = await readJson<{ codeText?: string; code_text?: string; spec_text?: string; testOutput?: string; test_output?: string }>(request);
  const codeText = body.codeText ?? body.code_text ?? body.spec_text ?? "";
  if (!codeText.trim()) return json({ error: "codeText is required" }, 400);
  const lesson = getLesson(session.lessonId);
  const gapAnalysis = await buildGapAnalysis(session.specText || "", codeText, lesson?.expectedConcepts ?? []);
  const reflectionPrompts = lesson?.reflectionPrompts ?? ["What changed between your spec and your final code?"];
  await addSubmission(sessionId, codeText, gapAnalysis, reflectionPrompts);
  const updated = await updateSession(sessionId, {
    codeText,
    testOutput: body.testOutput ?? body.test_output ?? null,
    currentPhase: "reflecting",
  });
  return json({
    ...publicSession(updated),
    gapAnalysis,
    gap_analysis: gapAnalysis,
    reflectionPrompts,
    reflection_prompts: reflectionPrompts,
  });
}
