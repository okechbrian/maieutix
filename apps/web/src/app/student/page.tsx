import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, Layers, Play, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { startStudentSession } from "./actions";
import { Button, EmptyState, MetricCard, PageContainer, PageFrame, PageHeader, Panel, StatusBadge } from "@/components/ui";

type ClassroomRecord = {
  id: string;
  name: string;
  join_code: string;
};

type EnrollmentRecord = {
  classroom_id: string;
  classrooms: ClassroomRecord | ClassroomRecord[] | null;
};

type SessionRecord = {
  id: string;
  classroom_id: string;
  assignment_id: string;
  lesson_id: string;
  current_phase: string;
  reflection_score: number | null;
  updated_at: string;
  assignments: { title: string } | { title: string }[] | null;
  lessons: { title: string; prompt: string } | { title: string; prompt: string }[] | null;
};

type AssignmentRecord = {
  id: string;
  classroom_id: string;
  lesson_id: string;
  title: string;
  due_at: string | null;
  created_at: string;
  lessons: { title: string; prompt: string } | { title: string; prompt: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function StudentPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, full_name, username")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) redirect("/login");
  if (profile.role === "owner" || profile.role === "teacher") redirect("/teacher");

  const { data: enrollmentsData } = await supabase
    .from("enrollments")
    .select("classroom_id, classrooms(id, name, join_code)")
    .eq("user_id", authData.user.id);

  const { data: sessionsData } = await supabase
    .from("sessions")
    .select("id, classroom_id, assignment_id, lesson_id, current_phase, reflection_score, updated_at, assignments(title), lessons(title, prompt)")
    .eq("student_user_id", authData.user.id)
    .order("updated_at", { ascending: false });

  const enrollments = (enrollmentsData ?? []) as EnrollmentRecord[];
  const classroomIds = enrollments.map((enrollment) => enrollment.classroom_id);
  const classroomById = new Map(
    enrollments.map((enrollment) => {
      const classroom = one(enrollment.classrooms);
      return [enrollment.classroom_id, classroom] as const;
    })
  );

  let assignments: AssignmentRecord[] = [];
  if (classroomIds.length > 0) {
    const { data: assignmentsData } = await supabase
      .from("assignments")
      .select("id, classroom_id, lesson_id, title, due_at, created_at, lessons(title, prompt)")
      .in("classroom_id", classroomIds)
      .order("created_at", { ascending: true });

    assignments = (assignmentsData ?? []) as AssignmentRecord[];
  }

  const sessions = (sessionsData ?? []) as SessionRecord[];
  const activeSessions = sessions.filter((session) => session.current_phase !== "complete");
  const completedSessions = sessions.filter((session) => session.current_phase === "complete");
  const sessionByAssignmentId = new Map(sessions.map((session) => [session.assignment_id, session]));

  return (
    <PageFrame>
      <PageContainer className="max-w-6xl">
        <PageHeader
          eyebrow="Student home"
          title={`Welcome, ${profile.full_name}`}
          description="Continue active work, start assigned lessons, and review completed sessions."
        />

        <section className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={<Users className="h-4 w-4" />} label="Classes" value={enrollments.length} />
          <MetricCard icon={<Layers className="h-4 w-4" />} label="Assigned" value={assignments.length} />
          <MetricCard icon={<Clock className="h-4 w-4" />} label="Active" value={activeSessions.length} />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={completedSessions.length} />
        </section>

        <Panel className="mt-6" title="Continue learning" description="Active sessions that are waiting for your next step.">
          <div className="divide-y divide-slate-200">
            {activeSessions.map((session) => {
              const assignment = one(session.assignments);
              const lesson = one(session.lessons);
              return (
                <div key={session.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{assignment?.title ?? lesson?.title ?? "Python lesson"}</p>
                    <p className="mt-1 text-sm text-slate-600">{lesson?.prompt ?? "Continue your learning session."}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Phase: {session.current_phase} / Score: {session.reflection_score ?? "-"} / Updated {formatDate(session.updated_at)}
                    </p>
                  </div>
                  <Link
                    href={`/session/${session.id}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Link>
                </div>
              );
            })}
            {activeSessions.length === 0 && (
              <EmptyState title="No active sessions" description="Start an assigned lesson below when you are ready." />
            )}
          </div>
        </Panel>

        <Panel className="mt-6" title="Assigned lessons" description="Lessons your teacher has assigned to your classes.">
          <div className="divide-y divide-slate-200">
            {assignments.map((assignment) => {
              const classroom = classroomById.get(assignment.classroom_id);
              const lesson = one(assignment.lessons);
              const session = sessionByAssignmentId.get(assignment.id);
              const isComplete = session?.current_phase === "complete";
              const status = session ? (isComplete ? "Complete" : "In progress") : "Not started";
              const tone = session ? (isComplete ? "success" : "primary") : "muted";
              return (
                <div key={assignment.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-950">{assignment.title || lesson?.title || "Python lesson"}</p>
                      <StatusBadge tone={tone}>{status}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{lesson?.prompt ?? "Continue your class assignment."}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {classroom?.name ?? "Classroom"} / Join code: {classroom?.join_code ?? "-"}
                    </p>
                  </div>
                  {session ? (
                    <Link
                      href={`/session/${session.id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                    >
                      <Play className="h-4 w-4" />
                      {isComplete ? "Review" : "Resume"}
                    </Link>
                  ) : (
                    <form action={startStudentSession}>
                      <input type="hidden" name="classroomId" value={assignment.classroom_id} />
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <Button variant="dark">
                        <Play className="h-4 w-4" />
                        Start
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
            {enrollments.length > 0 && assignments.length === 0 && (
              <EmptyState title="No assigned lessons yet" description="Your teacher has not assigned a lesson to this class yet." />
            )}
            {enrollments.length === 0 && (
              <EmptyState
                title="You are not enrolled in a class yet"
                description="Use the class code from your teacher to join."
                action={
                <Link href="/" className="mt-3 inline-block rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700">
                  Join with a class code
                </Link>
                }
              />
            )}
          </div>
        </Panel>

        {completedSessions.length > 0 && (
          <Panel className="mt-6" title="Completed" description="Finished work you can review later.">
            <div className="divide-y divide-slate-200">
              {completedSessions.map((session) => {
                const assignment = one(session.assignments);
                const lesson = one(session.lessons);
                return (
                  <div key={session.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">{assignment?.title ?? lesson?.title ?? "Python lesson"}</p>
                      <p className="mt-1 text-sm text-slate-600">{lesson?.prompt ?? "Completed learning session."}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Score: {session.reflection_score ?? "-"} / Updated {formatDate(session.updated_at)}
                      </p>
                    </div>
                    <Link
                      href={`/session/${session.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}
      </PageContainer>
    </PageFrame>
  );
}
