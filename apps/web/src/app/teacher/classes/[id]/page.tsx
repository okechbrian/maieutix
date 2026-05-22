"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clipboard,
  Download,
  Filter,
  Layers,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Student {
  id: string;
  studentName?: string;
  student_name?: string;
  currentPhase?: string;
  current_phase?: string;
  specText?: string | null;
  spec_text?: string | null;
  reflectionScore?: number | null;
  reflection_score?: number | null;
  updatedAt?: string;
  updated_at?: string;
}

interface ReasoningSignal {
  label: string;
  count: number;
  studentNames: string[];
}

interface ReflectionExample {
  studentName: string;
  reflectionText: string;
  score: number;
}

interface Lesson {
  id: string;
  title: string;
  summary: string;
  teacherNotes: string;
}

interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Assignment {
  id: string;
  title: string;
  lessonId?: string;
  lesson_id?: string;
  createdAt?: string;
  created_at?: string;
  activeStudents?: number;
  active_students?: number;
  completedStudents?: number;
  completed_students?: number;
  totalStudents?: number;
  total_students?: number;
  avgReflectionScore?: number;
  avg_reflection_score?: number;
  lesson?: Lesson;
}

interface Classroom {
  name: string;
  joinCode?: string;
  join_code?: string;
}

function phaseOf(student: Student) {
  return student.currentPhase ?? student.current_phase ?? "spec";
}

function metricValue(item: Assignment, camel: keyof Assignment, snake: keyof Assignment) {
  const value = item[camel] ?? item[snake];
  return typeof value === "number" ? value : 0;
}

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

export default function TeacherClassPage() {
  const params = useParams();
  const classroomId = params.id as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [phase, setPhase] = useState("all");
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [insights, setInsights] = useState<{
    reasoningSignals?: ReasoningSignal[];
    reasoning_signals?: ReasoningSignal[];
    exemplarReflections?: ReflectionExample[];
    exemplar_reflections?: ReflectionExample[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingLessonId, setCreatingLessonId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const lessons = useMemo(() => courses.flatMap((course) => course.lessons), [courses]);
  const assignedLessonIds = useMemo(
    () => new Set(assignments.map((assignment) => assignment.lessonId ?? assignment.lesson_id)),
    [assignments]
  );

  const filtered = phase === "all" ? students : students.filter((student) => phaseOf(student) === phase);
  const reasoningSignals = insights?.reasoningSignals ?? insights?.reasoning_signals ?? [];
  const exemplarReflections = insights?.exemplarReflections ?? insights?.exemplar_reflections ?? [];

  const classMetrics = useMemo(() => {
    const activeStudents = students.filter((student) => phaseOf(student) !== "complete").length;
    const completedStudents = students.filter((student) => phaseOf(student) === "complete").length;
    const scores = students
      .map((student) => student.reflectionScore ?? student.reflection_score)
      .filter((score): score is number => typeof score === "number");
    const avgReflectionScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : 0;

    return { activeStudents, completedStudents, avgReflectionScore };
  }, [students]);

  const load = useCallback(async function loadClassWorkspace() {
    setError(null);

    try {
      const [classResponse, studentsResponse, insightsResponse, assignmentsResponse, curriculumResponse] = await Promise.all([
        fetch(`/api/classrooms/${classroomId}`, { cache: "no-store" }),
        fetch(`/api/classrooms/${classroomId}/students`, { cache: "no-store" }),
        fetch(`/api/classrooms/${classroomId}/insights`, { cache: "no-store" }),
        fetch(`/api/classrooms/${classroomId}/assignments`, { cache: "no-store" }),
        fetch("/api/curriculum", { cache: "no-store" }),
      ]);

      const classData = await readResponse<Classroom>(classResponse, "Unable to load class");
      const studentData = await readResponse<Student[]>(studentsResponse, "Unable to load students");
      const insightData = await readResponse<typeof insights>(insightsResponse, "Unable to load insights");
      const assignmentData = await readResponse<{ assignments: Assignment[] }>(assignmentsResponse, "Unable to load assignments");
      const curriculumData = await readResponse<{ courses: Course[] }>(curriculumResponse, "Unable to load curriculum");

      setClassroom(classData);
      setStudents(studentData);
      setInsights(insightData);
      setAssignments(assignmentData.assignments || []);
      setCourses(curriculumData.courses || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load class workspace");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    load();
    
    const supabase = createClient();
    const channel = supabase.channel(`teacher-class-${classroomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `classroom_id=eq.${classroomId}` },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "submissions" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId, load]);

  async function createAssignment(lessonId: string) {
    setCreatingLessonId(lessonId);
    setError(null);

    try {
      const response = await fetch(`/api/classrooms/${classroomId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      await readResponse<Assignment>(response, "Unable to create assignment");
      await load();
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : "Unable to create assignment");
    } finally {
      setCreatingLessonId(null);
    }
  }

  async function copyJoinCode() {
    const code = classroom?.joinCode ?? classroom?.join_code;
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function exportCsv() {
    const rows = [
      ["Student", "Phase", "Score", "Spec", "Updated"],
      ...filtered.map((student) => [
        student.studentName ?? student.student_name ?? "",
        phaseOf(student),
        String(student.reflectionScore ?? student.reflection_score ?? ""),
        student.specText ?? student.spec_text ?? "",
        student.updatedAt ?? student.updated_at ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${classroom?.name ?? "class"}-progress.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <a href="/teacher" className="text-sm font-medium text-teal-700 hover:text-teal-900">Back to classes</a>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{classroom?.name ?? "Class workspace"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>Join code: {classroom?.joinCode ?? classroom?.join_code ?? classroomId}</span>
              <button
                onClick={copyJoinCode}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                title="Copy join code"
              >
                <Clipboard className="h-3.5 w-3.5" />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <Filter className="h-4 w-4" />
              <select value={phase} onChange={(event) => setPhase(event.target.value)} className="bg-transparent outline-none">
                <option value="all">All phases</option>
                <option value="spec">Spec</option>
                <option value="approved">Approved</option>
                <option value="editing">Editing</option>
                <option value="submitted">Submitted</option>
                <option value="reflecting">Reflecting</option>
                <option value="complete">Complete</option>
              </select>
            </label>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading class workspace
          </div>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-4">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><Users className="h-4 w-4" /> Students</div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{students.length}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><Layers className="h-4 w-4" /> Assignments</div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{assignments.length}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><BookOpen className="h-4 w-4" /> Active</div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{classMetrics.activeStudents}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="h-4 w-4" /> Avg reflection</div>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{classMetrics.avgReflectionScore || "-"}/5</p>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-md border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="font-medium text-slate-950">Students</h2>
                  <span className="text-sm text-slate-500">{filtered.length} shown</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="bg-slate-50 text-left text-sm text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-medium">Student</th>
                        <th className="px-4 py-3 font-medium">Phase</th>
                        <th className="px-4 py-3 font-medium">Score</th>
                        <th className="px-4 py-3 font-medium">Spec</th>
                        <th className="px-4 py-3 font-medium">Updated</th>
                        <th className="px-4 py-3 text-right font-medium">Session</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-sm">
                      {filtered.map((student) => (
                        <tr key={student.id}>
                          <td className="px-4 py-3 font-medium text-slate-950">{student.studentName ?? student.student_name}</td>
                          <td className="px-4 py-3 text-slate-600">{phaseOf(student)}</td>
                          <td className="px-4 py-3 text-slate-600">{student.reflectionScore ?? student.reflection_score ?? "-"}</td>
                          <td className="max-w-sm truncate px-4 py-3 text-slate-600">{student.specText ?? student.spec_text ?? "-"}</td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(student.updatedAt ?? student.updated_at)}</td>
                          <td className="px-4 py-3 text-right">
                            <a className="font-medium text-teal-700 hover:text-teal-900" href={`/session/${student.id}`}>Open</a>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-slate-500">No students match this phase yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-md border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h2 className="font-medium text-slate-950">Assignments</h2>
                  <p className="mt-1 text-sm text-slate-500">Assign lessons from the built-in Python track.</p>
                </div>
                <div className="divide-y divide-slate-200">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-950">{assignment.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{assignment.lesson?.summary ?? "Lesson assignment"}</p>
                        </div>
                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {metricValue(assignment, "activeStudents", "active_students")} active
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {metricValue(assignment, "completedStudents", "completed_students")} complete / {metricValue(assignment, "avgReflectionScore", "avg_reflection_score") || "-"}/5 avg / {formatDate(assignment.createdAt ?? assignment.created_at)}
                      </p>
                    </div>
                  ))}
                  {assignments.length === 0 && (
                    <p className="px-4 py-6 text-sm text-slate-500">No assignments yet. Add the first lesson below.</p>
                  )}
                </div>
                <div className="border-t border-slate-200 px-4 py-3">
                  <h3 className="text-sm font-medium text-slate-950">Add lesson</h3>
                  <div className="mt-3 space-y-2">
                    {lessons.map((lesson) => {
                      const assigned = assignedLessonIds.has(lesson.id);
                      return (
                        <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{lesson.title}</p>
                            <p className="truncate text-xs text-slate-500">{lesson.summary}</p>
                          </div>
                          <button
                            disabled={assigned || creatingLessonId === lesson.id}
                            onClick={() => createAssignment(lesson.id)}
                            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-teal-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {creatingLessonId === lesson.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            {assigned ? "Added" : "Assign"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-950">Reasoning signals</h2>
                <div className="mt-3 space-y-3">
                  {reasoningSignals.slice(0, 5).map((signal) => (
                    <div key={signal.label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{signal.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{signal.studentNames.slice(0, 4).join(", ") || "No students"}</p>
                      </div>
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{signal.count}</span>
                    </div>
                  ))}
                  {reasoningSignals.length === 0 && <p className="text-sm text-slate-500">Signals appear after students submit specs and code.</p>}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-slate-950">Strong reflections</h2>
                <div className="mt-3 space-y-3">
                  {exemplarReflections.map((example) => (
                    <div key={`${example.studentName}-${example.score}`} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-800">{example.studentName}</p>
                        <span className="text-xs font-semibold text-teal-700">{example.score}/5</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{example.reflectionText}</p>
                    </div>
                  ))}
                  {exemplarReflections.length === 0 && <p className="text-sm text-slate-500">High-quality reflection examples will appear here after scoring.</p>}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
