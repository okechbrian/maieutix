import { json } from "@/lib/api";
import { listDialogue } from "@/lib/store";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return json(listDialogue(sessionId));
}
