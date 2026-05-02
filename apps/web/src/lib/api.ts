import { NextResponse } from "next/server";
import type { LearningSession } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readJson<T extends Record<string, unknown>>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function publicSession(session: LearningSession) {
  return {
    ...session,
    classroom_id: session.classroomId,
    assignment_id: session.assignmentId,
    lesson_id: session.lessonId,
    student_name: session.studentName,
    current_phase: session.currentPhase,
    spec_text: session.specText,
    code_text: session.codeText,
    test_output: session.testOutput,
    reflection_text: session.reflectionText,
    reflection_score: session.reflectionScore,
    started_at: session.startedAt,
    updated_at: session.updatedAt,
  };
}
