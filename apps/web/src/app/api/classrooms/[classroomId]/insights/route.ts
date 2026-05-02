import { json } from "@/lib/api";
import { getClassroom, getClassroomInsights } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ classroomId: string }> }) {
  const { classroomId } = await params;
  const classroom = await getClassroom(classroomId);
  if (!classroom) return json({ error: "Classroom not found" }, 404);

  return json(await getClassroomInsights(classroom.id));
}
