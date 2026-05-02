import { json, readJson } from "@/lib/api";
import { createAssignment, getClassroom, listAssignments } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const classroom = await getClassroom(classroomId);
  if (!classroom) return json({ error: "Classroom not found" }, 404);
  return json({ assignments: await listAssignments(classroom.id) });
}

export async function POST(request: Request, { params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const classroom = await getClassroom(classroomId);
  if (!classroom) return json({ error: "Classroom not found" }, 404);
  const body = await readJson<{ lessonId?: string; lesson_id?: string }>(request);
  const assignment = await createAssignment(classroom.id, body.lessonId ?? body.lesson_id ?? "lesson-variables");
  return json(assignment, 201);
}
