import { json, readJson } from "@/lib/api";
import { createClassroom, listClassrooms } from "@/lib/store";

export async function GET() {
  return json({ classrooms: listClassrooms() });
}

export async function POST(request: Request) {
  const body = await readJson<{ name?: string }>(request);
  const classroom = createClassroom(body.name?.trim() || "New Python Class");
  return json(classroom, 201);
}
