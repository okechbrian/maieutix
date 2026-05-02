import { json } from "@/lib/api";
import { listCourses } from "@/lib/store";

export async function GET() {
  return json({ courses: listCourses() });
}
