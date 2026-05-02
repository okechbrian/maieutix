"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, Filter } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Student {
  id: string;
  studentName: string;
  student_name: string;
  currentPhase: string;
  current_phase: string;
  specText: string | null;
  spec_text: string | null;
  reflectionScore: number | null;
  reflection_score: number | null;
  updatedAt: string;
  updated_at: string;
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

export default function TeacherClassPage() {
  const params = useParams();
  const classroomId = params.id as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [phase, setPhase] = useState("all");
  const [classroom, setClassroom] = useState<{ name: string; joinCode: string; join_code: string } | null>(null);
  const [insights, setInsights] = useState<{
    reasoningSignals?: ReasoningSignal[];
    reasoning_signals?: ReasoningSignal[];
    exemplarReflections?: ReflectionExample[];
    exemplar_reflections?: ReflectionExample[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      const [classResponse, studentsResponse, insightsResponse] = await Promise.all([
        fetch(`/api/classrooms/${classroomId}`),
        fetch(`/api/classrooms/${classroomId}/students`),
        fetch(`/api/classrooms/${classroomId}/insights`),
      ]);
      if (classResponse.ok) setClassroom(await classResponse.json());
      if (studentsResponse.ok) setStudents(await studentsResponse.json());
      if (insightsResponse.ok) setInsights(await insightsResponse.json());
    }
    load();
    
    const supabase = createClient();
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions', filter: `classroom_id=eq.${classroomId}` },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'submissions' },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [classroomId]);

  const filtered = phase === "all" ? students : students.filter((student) => (student.currentPhase ?? student.current_phase) === phase);
  const reasoningSignals = insights?.reasoningSignals ?? insights?.reasoning_signals ?? [];
  const exemplarReflections = insights?.exemplarReflections ?? insights?.exemplar_reflections ?? [];

  function exportCsv() {
    const rows = [
      ["Student", "Phase", "Score", "Spec", "Updated"],
      ...filtered.map((student) => [
        student.studentName ?? student.student_name,
        student.currentPhase ?? student.current_phase,
        String(student.reflectionScore ?? student.reflection_score ?? ""),
        student.specText ?? student.spec_text ?? "",
        student.updatedAt ?? student.updated_at,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${classroom?.name ?? "class"}-progress.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{classroom?.name ?? "Class"}</h1>
            <p className="text-sm text-slate-600">Join code: {classroom?.joinCode ?? classroom?.join_code ?? classroomId}</p>
          </div>
          <div className="flex gap-2">
            <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              <Filter className="h-4 w-4" />
              <select value={phase} onChange={(event) => setPhase(event.target.value)} className="bg-transparent outline-none">
                <option value="all">All phases</option>
                <option value="spec">Spec</option>
                <option value="approved">Approved</option>
                <option value="editing">Editing</option>
                <option value="reflecting">Reflecting</option>
                <option value="complete">Complete</option>
              </select>
            </label>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900">
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Reasoning signals</h2>
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
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Strong reflections</h2>
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
          </section>
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Spec</th>
                <th className="px-4 py-3 font-medium">Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{student.studentName ?? student.student_name}</td>
                  <td className="px-4 py-3 text-slate-600">{student.currentPhase ?? student.current_phase}</td>
                  <td className="px-4 py-3 text-slate-600">{student.reflectionScore ?? student.reflection_score ?? "-"}</td>
                  <td className="max-w-md truncate px-4 py-3 text-slate-600">{student.specText ?? student.spec_text ?? "-"}</td>
                  <td className="px-4 py-3"><a className="text-teal-700 hover:text-teal-900" href={`/session/${student.id}`}>Open</a></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">No matching students yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
