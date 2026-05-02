export type SpecQuality = {
  approved: boolean;
  summary: string;
  missing: string[];
};

const DEFAULT_MODEL = "gpt-4o-mini";
const MODEL = process.env.MAIEUTIX_AI_MODEL || DEFAULT_MODEL;

export async function evaluateSpecQuality(specText: string): Promise<SpecQuality> {
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are a strict Computer Science grader. Analyze the student's specification. It must clearly define: 1) input/starting data, 2) expected output/end state, and 3) at least one conditional boundary or edge case. If it misses any, reject it and list what is missing. Keep the summary under 180 characters.",
            },
            {
              role: "user",
              content: `Student Spec:\n${specText}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "spec_quality",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  approved: { type: "boolean", description: "True if input, output, and edge cases are all clearly defined." },
                  summary: { type: "string", description: "A concise summary of the program behavior based on the spec." },
                  missing: { type: "array", items: { type: "string" }, description: "Specific missing elements (input, output, or edge cases). Empty if approved." }
                },
                required: ["approved", "summary", "missing"],
                additionalProperties: false,
              }
            }
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content) as SpecQuality;
        }
      }
    } catch (error) {
      console.error("LLM evaluateSpecQuality failed, falling back to rules:", error);
    }
  }

  // Fallback Rule-based Evaluator
  const normalized = specText.toLowerCase();
  const missing: string[] = [];

  if (specText.trim().length < 80) {
    missing.push("Add more detail about the program behavior.");
  }
  if (!/\b(input|ask|enter|given|when|user|value|data)\b/.test(normalized)) {
    missing.push("Describe the input or starting data.");
  }
  if (!/\b(output|print|return|show|display|result)\b/.test(normalized)) {
    missing.push("Describe the expected output.");
  }
  if (!/\b(if|when|otherwise|edge|empty|invalid|less than|greater than|equal|case)\b/.test(normalized)) {
    missing.push("Cover at least one decision, edge case, or boundary.");
  }

  return {
    approved: missing.length === 0,
    summary: specText.trim().replace(/\s+/g, " ").slice(0, 180),
    missing,
  };
}

export async function buildGapAnalysis(specText: string | null, codeText: string, expectedConcepts: string[]): Promise<Record<string, string>> {
  if (process.env.OPENAI_API_KEY && specText) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are an analytical coding tutor. Compare the student's specification against their submitted Python code. Identify any gaps where the code fails to implement what the spec claimed, or fails to use the expected concepts. Return a dictionary of specific gaps. If there are no gaps, return an empty dictionary. The keys should be short labels (e.g. 'edge_case', 'missing_input') and values should be a concise, constructive 1-sentence explanation of the gap.",
            },
            {
              role: "user",
              content: `Expected Concepts: ${expectedConcepts.join(", ")}\n\nStudent Spec:\n${specText}\n\nSubmitted Code:\n${codeText}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "gap_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  gaps: {
                    type: "object",
                    patternProperties: {
                      "^[a-zA-Z0-9_]+$": { type: "string" }
                    },
                    additionalProperties: false,
                    description: "Dictionary of gaps. Empty if no gaps."
                  }
                },
                required: ["gaps"],
                additionalProperties: false,
              }
            }
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return parsed.gaps as Record<string, string>;
        }
      }
    } catch (error) {
      console.error("LLM buildGapAnalysis failed, falling back to rules:", error);
    }
  }

  // Fallback Rule-based Gap Analysis
  const gaps: Record<string, string> = {};
  const spec = (specText ?? "").toLowerCase();
  const code = codeText.toLowerCase();

  for (const concept of expectedConcepts) {
    const needle = concept.split(" ")[0].toLowerCase();
    if (!code.includes(needle) && ["if", "elif", "else", "for", "def", "input"].includes(needle)) {
      gaps[concept] = `Your spec or lesson expects ${concept}, but the submitted code does not clearly show it.`;
    }
  }

  if (/\bempty|invalid|negative|zero|edge\b/.test(spec) && !/\bif|try|except|raise\b/.test(code)) {
    gaps.edgeCase = "Your spec mentions an edge case, but the code does not appear to handle one explicitly.";
  }
  if (/\binput|ask|enter|user\b/.test(spec) && !/\binput\s*\(/.test(code)) {
    gaps.input = "Your spec describes user input, but the code does not ask the user for input.";
  }
  if (/\bprint|show|display|output\b/.test(spec) && !/\bprint\s*\(/.test(code)) {
    gaps.output = "Your spec describes visible output, but the code does not print anything.";
  }
  if (codeText.trim().length < 30) {
    gaps.detail = "The submitted code is very short; add enough detail to show your spec working.";
  }

  return gaps;
}

export type ReasoningSignal = {
  label: string;
  count: number;
  studentNames: string[];
};

export type ReflectionExample = {
  studentName: string;
  reflectionText: string;
  score: number;
};

export type ReasoningAnalyticsInput = {
  studentName: string;
  specText: string | null;
  codeText: string | null;
  reflectionText: string | null;
  reflectionScore: number | null;
  latestGapAnalysis?: Record<string, string>;
};

function addSignal(signals: Map<string, Set<string>>, label: string, studentName: string) {
  const students = signals.get(label) ?? new Set<string>();
  students.add(studentName);
  signals.set(label, students);
}

export function analyzeReasoningSignals(sessions: ReasoningAnalyticsInput[]) {
  const signals = new Map<string, Set<string>>();

  for (const session of sessions) {
    const spec = session.specText?.toLowerCase() ?? "";
    const code = session.codeText?.toLowerCase() ?? "";
    const studentName = session.studentName;

    if (!session.specText || session.specText.trim().length < 80) {
      addSignal(signals, "Vague or missing specification", studentName);
    }
    if (session.specText && !/\b(input|ask|enter|given|when|user|value|data)\b/.test(spec)) {
      addSignal(signals, "Spec does not name inputs", studentName);
    }
    if (session.specText && !/\b(output|print|return|show|display|result)\b/.test(spec)) {
      addSignal(signals, "Spec does not name outputs", studentName);
    }
    if (/\bempty|invalid|negative|zero|edge\b/.test(spec) && !/\bif|try|except|raise\b/.test(code)) {
      addSignal(signals, "Edge cases described but not implemented", studentName);
    }
    if (/\binput|ask|enter|user\b/.test(spec) && code && !/\binput\s*\(/.test(code)) {
      addSignal(signals, "Input behavior drifted from spec", studentName);
    }
    if (/\bprint|show|display|output\b/.test(spec) && code && !/\bprint\s*\(/.test(code)) {
      addSignal(signals, "Output behavior drifted from spec", studentName);
    }

    if (session.latestGapAnalysis) {
      for (const [gapKey, gapMessage] of Object.entries(session.latestGapAnalysis)) {
         // Create a readable label from the gap key, e.g. "missing_input" -> "Missing input"
         const label = `LLM Flag: ${gapKey.replace(/_/g, " ")}`;
         addSignal(signals, label, studentName);
      }
    }
  }

  const reasoningSignals: ReasoningSignal[] = [...signals.entries()]
    .map(([label, studentNames]) => ({
      label,
      count: studentNames.size,
      studentNames: [...studentNames].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const exemplarReflections: ReflectionExample[] = sessions
    .filter((session): session is ReasoningAnalyticsInput & { reflectionText: string; reflectionScore: number } =>
      typeof session.reflectionText === "string" &&
      session.reflectionText.trim().length >= 80 &&
      typeof session.reflectionScore === "number" &&
      session.reflectionScore >= 4,
    )
    .map((session) => ({
      studentName: session.studentName,
      reflectionText: session.reflectionText.trim(),
      score: session.reflectionScore,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return { reasoningSignals, exemplarReflections };
}
