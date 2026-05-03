import { getLesson } from "./curriculum";
import { evaluateSpecQuality } from "./maieutic";
import { addDialogueTurn, getSession, listDialogue, addAiEvent, getAiAuditEvents as storeGetAiAuditEvents } from "./store";

const DEFAULT_MODEL = "gpt-5-mini";
const MODEL = process.env.MAIEUTIX_AI_MODEL || DEFAULT_MODEL;
const RATE_LIMIT_PER_SESSION = 30;

const COACH_INSTRUCTIONS = `You are the Maieutix Socratic AI coach for school students in Uganda and Kenya.
Use age-appropriate explanations. Ask one focused question first. Do not dump full working solutions.
During specification, never write code or suggest implementation details. Probe inputs, outputs, edge cases, and ambiguous behavior.
Only approve a specification when it is precise, complete, covers at least one edge case, and matches the assignment intent.
When ready, output exactly: [SPEC_APPROVED] followed by a one-sentence summary of the approved spec.
During coding, answer narrow syntax questions only when asked; refuse "fix my code" or complete-solution requests and redirect to the student's spec.
If the learner asks for the complete answer, give a small hint and ask them to try one focused change.
Keep responses under 120 words unless the teacher-facing prompt explicitly asks for detail.
All messages are visible to teachers, so be precise, respectful, and safe.`;

async function fallbackCoachReply(message: string, lessonTitle: string) {
  const asksForAnswer = /answer|complete code|solution|do it for me|write the code/i.test(message);
  if (asksForAnswer) {
    return `I cannot give the full solution, but I can help you take the next step. For "${lessonTitle}", what should your program print first, and what variable or condition controls that output?`;
  }
  const specQuality = await evaluateSpecQuality(message);
  if (specQuality.approved) {
    return `[SPEC_APPROVED] ${specQuality.summary}`;
  }
  return `Good start. What is one input, one processing step, and one output your program needs for "${lessonTitle}"? Write those three pieces, then we can check the plan together.`;
}

function extractResponseText(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const maybe = data as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: string }> }> };
  if (typeof maybe.output_text === "string") return maybe.output_text;
  const text = maybe.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
  return text || null;
}

export async function createCoachReply(sessionId: string, message: string) {
  const session = await getSession(sessionId);
  if (!session) throw new Error("Session not found");
  const lesson = getLesson(session.lessonId);
  const turns = await listDialogue(sessionId);
  const studentTurns = turns.filter((turn) => turn.role === "student").length;

  await addDialogueTurn(sessionId, "student", message);

  if (studentTurns >= RATE_LIMIT_PER_SESSION) {
    const reply = "Pause here and ask your teacher for a quick check. This session has reached its coaching message limit.";
    await addDialogueTurn(sessionId, "coach", reply);
    return reply;
  }

  const fallback = await fallbackCoachReply(message, lesson?.title ?? "this lesson");

  if (!process.env.OPENAI_API_KEY) {
    await addDialogueTurn(sessionId, "coach", fallback);
    await addAiEvent({ sessionId, model: MODEL, status: "fallback_no_api_key" });
    return fallback;
  }

  try {
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: COACH_INSTRUCTIONS },
          {
            role: "user",
            content: `Lesson: ${lesson?.title}\nPrompt: ${lesson?.prompt}\nExpected concepts: ${lesson?.expectedConcepts.join(", ")}\nCurrent spec: ${session.specText ?? "not written"}\nRecent dialogue: ${turns.slice(-6).map((turn) => `${turn.role}: ${turn.content}`).join("\n")}\nStudent message: ${message}`,
          },
        ],
        max_tokens: 220,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI response failed with ${response.status}`);
    }

    const data = await response.json();
    const reply = extractResponseText(data) ?? fallback;
    const usage = data.usage || {};
    
    await addDialogueTurn(sessionId, "coach", reply);
    await addAiEvent({
      sessionId,
      model: MODEL,
      status: "ok",
      responseId: typeof data?.id === "string" ? data.id : undefined,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
    });
    return reply;
  } catch (error) {
    await addDialogueTurn(sessionId, "coach", fallback);
    await addAiEvent({
      sessionId,
      model: MODEL,
      status: "fallback_error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return fallback;
  }
}

export async function getAiAuditEvents() {
  return await storeGetAiAuditEvents();
}
