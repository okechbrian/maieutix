import { json } from "@/lib/api";
import { getLatestSubmission } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    return json({ submission: await getLatestSubmission(sessionId) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load latest submission" }, 404);
  }
}
