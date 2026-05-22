import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, Clock, Play, Users } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { startStudentSession } from "./actions";

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
  lesson_id: string;
  current_phase: string;
  reflection_score: number | null;
  updated_at: string;
  assignments: { title: string } | { title: string }[] | null;
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
    .select("id, classroom_id, lesson_id, current_phase, reflection_score, updated_at, assignments(title), lessons(title, prompt)")
    .eq("student_user_id", authData.user.id)
    .order("updated_at", { ascending: false });

  const enrollments = (enrollmentsData ?? []) as EnrollmentRecord[];
  const sessions = (sessionsData ?? []) as SessionRecord[];
  const activeSessions = sessions.filter((session) => session.current_phase !== "complete");
  const completedSessions = sessions.filter((session) => session.current_phase === "complete");

  return (
    <div className="min-h-[80vh] bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <p className="text-sm font-medium text-teal-700">Student home</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Welcome, {profile.full_name}</h1>
          <p className="mt-1 text-sm text-slate-600">Resume your coding sessions or start the next class assignment.</p>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" /> Classes</div>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{enrollments.length}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500"><Clock className="h-4 w-4" /> Active sessions</div>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{activeSessions.length}</p>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="h-4 w-4" /> Completed</div>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{completedSessions.length}</p>
          </div>
        </section>

        <section className="mt-6 rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-950">Your sessions</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {sessions.map((session) => {
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
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </Link>
                </div>
              );
            })}
            {sessions.length === 0 && (
              <div className="px-4 py-10 text-center">
                <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
                <h3 className="mt-3 font-medium text-slate-950">No sessions yet</h3>
                <p className="mt-1 text-sm text-slate-600">Start from one of your enrolled classes below.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-md border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-950">Your classes</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {enrollments.map((enrollment) => {
              const classroom = one(enrollment.classrooms);
              const hasSession = sessions.some((session) => session.classroom_id === enrollment.classroom_id);
              return (
                <div key={enrollment.classroom_id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-950">{classroom?.name ?? "Classroom"}</p>
                    <p className="mt-1 text-sm text-slate-600">Join code: {classroom?.join_code ?? "-"}</p>
                  </div>
                  {hasSession ? (
                    <span className="text-sm text-slate-500">Session already started</span>
                  ) : (
                    <form action={startStudentSession}>
                      <input type="hidden" name="classroomId" value={enrollment.classroom_id} />
                      <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        <Play className="h-4 w-4" />
                        Start assignment
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
            {enrollments.length === 0 && (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-slate-600">You are not enrolled in a class yet.</p>
                <Link href="/" className="mt-3 inline-block rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700">
                  Join with a class code
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
