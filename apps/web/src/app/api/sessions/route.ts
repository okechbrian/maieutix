import { json, publicSession, readJson } from "@/lib/api";
import { createSession } from "@/lib/store";

export async function POST(request: Request) {
  const body = await readJson<{
    classroomId?: string;
    classroom_id?: string;
    joinCode?: string;
    studentName?: string;
    student_name?: string;
    assignmentId?: string;
    assignment_id?: string;
    lessonId?: string;
    lesson_id?: string;
  }>(request);

  const classroomId = body.classroomId ?? body.classroom_id ?? body.joinCode;
  const studentName = body.studentName ?? body.student_name;
  if (!classroomId || !studentName) {
    return json({ error: "classroomId and studentName are required" }, 400);
  }

  try {
    const session = await createSession({
      classroomId,
      studentName,
      assignmentId: body.assignmentId ?? body.assignment_id,
      lessonId: body.lessonId ?? body.lesson_id,
    });
    return json(publicSession(session), 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create session" }, 404);
  }
}
