import { getAiAuditEvents } from "@/lib/aiCoach";
import { json } from "@/lib/api";

export async function GET() {
  return json({ events: getAiAuditEvents() });
}
