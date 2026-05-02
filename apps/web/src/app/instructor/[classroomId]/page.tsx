"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, Brain, AlertTriangle, Eye, ArrowLeft, GraduationCap } from "lucide-react";

interface Student {
  id: string;
  student_name: string;
  current_phase: string;
  spec_text: string | null;
  started_at: string | null;
}

interface Insights {
  struggles: string[];
  phase_distribution: Record<string, number>;
  avg_score: number;
  most_common_gap: string;
  total_students: number;
  reasoning_signals?: Array<{
    label: string;
    count: number;
    studentNames: string[];
  }>;
  exemplar_reflections?: Array<{
    studentName: string;
    reflectionText: string;
    score: number;
  }>;
}

interface Classroom {
  id: string;
  name: string;
  join_code: string;
  active_students: number;
  avg_reflection_score: number;
}

const PHASE_COLORS: Record<string, string> = {
  spec: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  editing: "bg-teal-100 text-teal-800",
  submitted: "bg-purple-100 text-purple-800",
  reflecting: "bg-orange-100 text-orange-800",
  complete: "bg-gray-100 text-gray-800",
};

export default function InstructorDashboard() {
  const params = useParams();
  const classroomId = params.classroomId as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const [classRes, studentsRes, insightsRes] = await Promise.all([
        fetch(`/api/classrooms/${classroomId}`),
        fetch(`/api/classrooms/${classroomId}/students`),
        fetch(`/api/classrooms/${classroomId}/insights`),
      ]);

      if (classRes.ok) setClassroom(await classRes.json());
      if (studentsRes.ok) setStudents(await studentsRes.json());
      if (insightsRes.ok) setInsights(await insightsRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredStudents = filter === "all" 
    ? students 
    : students.filter(s => s.current_phase === filter);

  const activeStudents = students.filter(s => s.current_phase !== "complete").length;
  const completedStudents = students.filter(s => s.current_phase === "complete").length;

  if (loading || !classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-teal-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{classroom.name}</h1>
              <p className="text-sm text-slate-500">Code: {classroom.join_code}</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Active Students</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{activeStudents}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Completed</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{completedStudents}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Avg Score</span>
            </div>
            <p className="text-2xl font-semibold text-slate-800">{insights?.avg_score || "-"}/5</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Common Gap</span>
            </div>
            <p className="text-lg font-semibold text-slate-800 truncate">{insights?.most_common_gap || "-"}</p>
          </div>
        </div>

        {insights && insights.struggles.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 mb-2">Class Insights</h3>
            <ul className="space-y-1">
              {insights.struggles.map((s, i) => (
                <li key={i} className="text-sm text-yellow-700">• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h3 className="font-medium text-slate-800 mb-3">Reasoning Signals</h3>
              <div className="space-y-3">
                {(insights.reasoning_signals ?? []).slice(0, 5).map((signal) => (
                  <div key={signal.label} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{signal.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{signal.studentNames.slice(0, 4).join(", ") || "No students"}</p>
                    </div>
                    <span className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{signal.count}</span>
                  </div>
                ))}
                {(insights.reasoning_signals ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">Signals appear after students submit specs and code.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <h3 className="font-medium text-slate-800 mb-3">Strong Reflections</h3>
              <div className="space-y-3">
                {(insights.exemplar_reflections ?? []).map((example) => (
                  <div key={`${example.studentName}-${example.score}`} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">{example.studentName}</p>
                      <span className="text-xs font-semibold text-teal-700">{example.score}/5</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{example.reflectionText}</p>
                  </div>
                ))}
                {(insights.exemplar_reflections ?? []).length === 0 && (
                  <p className="text-sm text-slate-500">High-quality reflection examples will appear here after scoring.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-medium text-slate-800">Students</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-slate-300 rounded px-2 py-1"
            >
              <option value="all">All Phases</option>
              <option value="spec">Spec</option>
              <option value="approved">Approved</option>
              <option value="submitted">Submitted</option>
              <option value="reflecting">Reflecting</option>
              <option value="complete">Complete</option>
            </select>
          </div>

          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Student</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Phase</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Spec</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-600">Last Activity</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No students yet
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-800">{student.student_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${PHASE_COLORS[student.current_phase]}`}>
                        {student.current_phase}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-xs">
                      {student.spec_text || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {student.started_at ? new Date(student.started_at).toLocaleTimeString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="text-teal-600 hover:text-teal-800 text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">{selectedStudent.student_name}</h2>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-500 hover:text-slate-700">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-slate-700 mb-1">Current Phase</h3>
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${PHASE_COLORS[selectedStudent.current_phase]}`}>
                  {selectedStudent.current_phase}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-slate-700 mb-1">Spec</h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{selectedStudent.spec_text || "No spec yet"}</p>
              </div>
              <div>
                <a
                  href={`/session/${selectedStudent.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 text-sm"
                >
                  <Eye className="w-4 h-4" />
                  Open session in new tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
