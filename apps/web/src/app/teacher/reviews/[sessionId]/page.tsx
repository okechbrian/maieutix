"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Alert, Button, EmptyState, PageContainer, PageFrame, PageHeader, Panel, StatusBadge, TextArea } from "@/components/ui";

type SessionDetail = {
  id: string;
  classroomId: string;
  classroom_id: string;
  studentName: string;
  student_name: string;
  currentPhase: string;
  current_phase: string;
  specText: string | null;
  spec_text: string | null;
  codeText: string | null;
  code_text: string | null;
  testOutput: string | null;
  test_output: string | null;
  reflectionText: string | null;
  reflection_text: string | null;
  reflectionScore: number | null;
  reflection_score: number | null;
  updatedAt: string;
  updated_at: string;
  lesson?: {
    title: string;
    prompt: string;
    expectedConcepts: string[];
    visibleTests: string[];
    teacherNotes: string;
  };
};

type DialogueTurn = {
  id: string;
  role: string;
  content: string;
  timestamp: string;
};

type TeacherReview = {
  id: string;
  category: "general" | "spec" | "code" | "reflection";
  status: "reviewed" | "needs_attention";
  message: string;
  createdAt: string;
};

type LatestSubmission = {
  id: string;
  codeText: string;
  gapAnalysis: Record<string, string>;
  reflectionPrompts: string[];
  createdAt: string;
} | null;

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function readResponse<T>(response: Response, fallback: string): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || fallback);
  return data as T;
}

export default function TeacherReviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [reviews, setReviews] = useState<TeacherReview[]>([]);
  const [latestSubmission, setLatestSubmission] = useState<LatestSubmission>(null);
  const [category, setCategory] = useState<TeacherReview["category"]>("general");
  const [status, setStatus] = useState<TeacherReview["status"]>("reviewed");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestReview = reviews[0];
  const gaps = useMemo(() => Object.entries(latestSubmission?.gapAnalysis ?? {}), [latestSubmission]);

  const load = useCallback(async function loadReviewWorkspace() {
    setError(null);
    try {
      const [sessionResponse, dialogueResponse, reviewsResponse, submissionResponse] = await Promise.all([
        fetch(`/api/sessions/${sessionId}`, { cache: "no-store" }),
        fetch(`/api/sessions/${sessionId}/dialogue`, { cache: "no-store" }),
        fetch(`/api/sessions/${sessionId}/reviews`, { cache: "no-store" }),
        fetch(`/api/sessions/${sessionId}/latest-submission`, { cache: "no-store" }),
      ]);

      const sessionData = await readResponse<SessionDetail>(sessionResponse, "Unable to load session");
      const dialogueData = await readResponse<DialogueTurn[]>(dialogueResponse, "Unable to load dialogue");
      const reviewsData = await readResponse<{ reviews: TeacherReview[] }>(reviewsResponse, "Unable to load reviews");
      const submissionData = await readResponse<{ submission: LatestSubmission }>(submissionResponse, "Unable to load latest submission");

      setSession(sessionData);
      setDialogue(dialogueData);
      setReviews(reviewsData.reviews || []);
      setLatestSubmission(submissionData.submission);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load review workspace");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, status, message }),
      });
      await readResponse<TeacherReview>(response, "Unable to save review");
      setMessage("");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageFrame>
      <PageContainer>
        <PageHeader
          eyebrow="Teacher review"
          title={session?.studentName ?? session?.student_name ?? "Student session"}
          description={session?.lesson ? `${session.lesson.title}: ${session.lesson.prompt}` : "Review the student's work and leave visible feedback."}
          actions={
            session ? (
              <Link
                href={`/teacher/classes/${session.classroomId ?? session.classroom_id}`}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to class
              </Link>
            ) : null
          }
        />

        {error && <div className="mb-4"><Alert>{error}</Alert></div>}

        {loading ? (
          <Panel>
            <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading review workspace
            </div>
          </Panel>
        ) : !session ? (
          <Panel><EmptyState title="Session not found" /></Panel>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <Panel title="Review summary" description="This is read-only. Feedback is the teacher action for this workflow.">
                <div className="grid gap-4 p-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Phase</p>
                    <div className="mt-2"><StatusBadge tone={session.currentPhase === "complete" || session.current_phase === "complete" ? "success" : "primary"}>{session.currentPhase ?? session.current_phase}</StatusBadge></div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Reflection</p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{session.reflectionScore ?? session.reflection_score ?? "-"}/5</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Latest review</p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{latestReview ? latestReview.status.replace("_", " ") : "Not reviewed"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">Updated</p>
                    <p className="mt-2 text-sm font-medium text-slate-950">{formatDate(session.updatedAt ?? session.updated_at)}</p>
                  </div>
                </div>
              </Panel>

              <Panel title="Specification">
                <div className="p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{session.specText ?? session.spec_text ?? "No spec saved yet."}</p>
                </div>
              </Panel>

              <Panel title="Code">
                <pre className="max-h-[460px] overflow-auto bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                  {session.codeText ?? session.code_text ?? "# No code saved yet"}
                </pre>
              </Panel>

              <Panel title="Latest submission gaps" description={latestSubmission ? `Submitted ${formatDate(latestSubmission.createdAt)}` : undefined}>
                <div className="p-4">
                  {gaps.length ? (
                    <ul className="space-y-2 text-sm text-slate-700">
                      {gaps.map(([key, value]) => (
                        <li key={key} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                          <span className="font-medium">{key}: </span>{value}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No submitted gap analysis yet.</p>
                  )}
                </div>
              </Panel>

              <Panel title="Reflection">
                <div className="p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{session.reflectionText ?? session.reflection_text ?? "No reflection submitted yet."}</p>
                </div>
              </Panel>

              <Panel title="Coach dialogue">
                <div className="max-h-[520px] space-y-3 overflow-auto p-4">
                  {dialogue.length ? dialogue.map((turn) => (
                    <div key={turn.id} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="font-medium capitalize text-slate-950">{turn.role}</span>
                        <span className="text-xs text-slate-500">{formatDate(turn.timestamp)}</span>
                      </div>
                      <p className="whitespace-pre-wrap leading-6 text-slate-700">{turn.content}</p>
                    </div>
                  )) : <EmptyState title="No dialogue yet" />}
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title="Leave feedback" description="Students will see this feedback in their session.">
                <form onSubmit={saveReview} className="space-y-4 p-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Category
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value as TeacherReview["category"])}
                      className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="general">General</option>
                      <option value="spec">Spec</option>
                      <option value="code">Code</option>
                      <option value="reflection">Reflection</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Status
                    <select
                      value={status}
                      onChange={(event) => setStatus(event.target.value as TeacherReview["status"])}
                      className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="reviewed">Reviewed</option>
                      <option value="needs_attention">Needs attention</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Feedback
                    <TextArea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={5}
                      placeholder="Write a specific next step or confirmation for the student..."
                      className="mt-1"
                    />
                  </label>
                  <Button type="submit" loading={saving} disabled={!message.trim()} className="w-full">
                    {!saving && <Send className="h-4 w-4" />}
                    Share feedback
                  </Button>
                </form>
              </Panel>

              <Panel title="Review history">
                <div className="divide-y divide-slate-200">
                  {reviews.length ? reviews.map((review) => (
                    <div key={review.id} className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={review.status === "needs_attention" ? "warning" : "success"}>
                          {review.status === "needs_attention" ? "Needs attention" : "Reviewed"}
                        </StatusBadge>
                        <StatusBadge tone="muted">{review.category}</StatusBadge>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.message}</p>
                      <p className="mt-2 text-xs text-slate-500">{formatDate(review.createdAt)}</p>
                    </div>
                  )) : (
                    <EmptyState title="No review history" description="Leave the first feedback note for this student." />
                  )}
                </div>
              </Panel>

              <Panel title="Review checklist">
                <div className="space-y-3 p-4 text-sm text-slate-700">
                  <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" /> Spec names input, output, steps, and an edge case.</p>
                  <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" /> Code matches the spec and lesson concepts.</p>
                  <p className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-teal-600" /> Reflection explains what changed and why.</p>
                  <p className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" /> Use needs attention only when the student has a clear next action.</p>
                </div>
              </Panel>
            </div>
          </div>
        )}
      </PageContainer>
    </PageFrame>
  );
}
