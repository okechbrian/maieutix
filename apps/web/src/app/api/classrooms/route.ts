import { json, readJson } from "@/lib/api";
import { createClassroom, listClassrooms } from "@/lib/store";

export async function GET() {
  try {
    return json({ classrooms: await listClassrooms() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load classrooms";
    return json({ error: message }, message === "Not authenticated" ? 401 : 500);
  }
}

export async function POST(request: Request) {
  const body = await readJson<{ name?: string }>(request);
  try {
    const classroom = await createClassroom(body.name?.trim() || "New Python Class");
    return json(classroom, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create classroom";
    return json({ error: message }, message === "Not authenticated" ? 401 : 400);
  }
}
