import { json, readJson } from "@/lib/api";
import { createTeacherReview, listTeacherReviews } from "@/lib/store";
import type { TeacherReviewCategory, TeacherReviewStatus } from "@/lib/types";

const categories = new Set(["general", "spec", "code", "reflection"]);
const statuses = new Set(["reviewed", "needs_attention"]);

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
    return json({ reviews: await listTeacherReviews(sessionId) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to load reviews" }, 404);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const body = await readJson<{
    category?: string;
    status?: string;
    message?: string;
  }>(request);

  const category = body.category ?? "general";
  const status = body.status ?? "reviewed";
  const message = body.message?.trim() ?? "";

  if (!categories.has(category)) return json({ error: "Invalid review category" }, 400);
  if (!statuses.has(status)) return json({ error: "Invalid review status" }, 400);
  if (message.length < 3) return json({ error: "Feedback message is required" }, 400);

  try {
    const review = await createTeacherReview({
      sessionId,
      category: category as TeacherReviewCategory,
      status: status as TeacherReviewStatus,
      message,
    });
    return json(review, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to save review" }, 403);
  }
}
