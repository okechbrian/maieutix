import { json, readJson } from "@/lib/api";
import { createClassroom, listClassrooms } from "@/lib/store";

export async function GET() {
  return json({ classrooms: await listClassrooms() });
}

export async function POST(request: Request) {
  const body = await readJson<{ name?: string }>(request);
  const classroom = await createClassroom(body.name?.trim() || "New Python Class");
  return json(classroom, 201);
}
