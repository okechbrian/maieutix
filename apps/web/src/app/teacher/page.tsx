"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, BookOpen, Activity } from "lucide-react";

interface Classroom {
  id: string;
  name: string;
  joinCode: string;
  join_code: string;
  activeStudents: number;
  active_students: number;
  avgReflectionScore: number;
  avg_reflection_score: number;
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [className, setClassName] = useState("");

  async function loadData() {
    const classRes = await fetch("/api/classrooms");
    
    if (classRes.ok) {
      const data = await classRes.json();
      setClassrooms(data.classrooms || data); // Depending on array vs object structure
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createClass(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: className || "Python Pilot Class" }),
    });
    if (response.ok) {
      setClassName("");
      await loadData();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Teacher Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Manage pilot classes, assignments, and live student progress.</p>
          </div>
          <form onSubmit={createClass} className="flex gap-2">
            <input
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Class name"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            />
            <button className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
              <Plus className="h-4 w-4" />
              Create
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500"><Users className="h-4 w-4" /> Active students</div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {Array.isArray(classrooms) ? classrooms.reduce((sum, item) => sum + (item.activeStudents ?? item.active_students ?? 0), 0) : 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500"><BookOpen className="h-4 w-4" /> Built-in course</div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Python Beginner</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-slate-500"><Activity className="h-4 w-4" /> Learning mode</div>
            <p className="mt-2 text-2xl font-semibold text-slate-900">Pilot</p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="font-medium text-slate-900">Classes</h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Join code</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Average score</th>
                <th className="px-4 py-3 text-right font-medium">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Array.isArray(classrooms) && classrooms.map((classroom) => (
                <tr key={classroom.id} className="text-sm">
                  <td className="px-4 py-3 font-medium text-slate-900">{classroom.name}</td>
                  <td className="px-4 py-3 text-slate-600">{classroom.joinCode ?? classroom.join_code}</td>
                  <td className="px-4 py-3 text-slate-600">{classroom.activeStudents ?? classroom.active_students}</td>
                  <td className="px-4 py-3 text-slate-600">{classroom.avgReflectionScore ?? classroom.avg_reflection_score}/5</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => router.push(`/teacher/classes/${classroom.id}`)} className="text-teal-700 hover:text-teal-900">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
