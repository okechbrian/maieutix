"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Clipboard,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { Alert, Button, EmptyState, MetricCard, PageContainer, PageFrame, PageHeader, Panel, TextInput } from "@/components/ui";

interface Classroom {
  id: string;
  name: string;
  joinCode?: string;
  join_code?: string;
  activeStudents?: number;
  active_students?: number;
  completedStudents?: number;
  completed_students?: number;
  totalStudents?: number;
  total_students?: number;
  avgReflectionScore?: number;
  avg_reflection_score?: number;
  latestActivityAt?: string | null;
  latest_activity_at?: string | null;
}

function metricValue(classroom: Classroom, camel: keyof Classroom, snake: keyof Classroom) {
  const value = classroom[camel] ?? classroom[snake];
  return typeof value === "number" ? value : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "No sessions yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const activeStudents = classrooms.reduce((sum, item) => sum + metricValue(item, "activeStudents", "active_students"), 0);
    const completedStudents = classrooms.reduce((sum, item) => sum + metricValue(item, "completedStudents", "completed_students"), 0);
    const totalStudents = classrooms.reduce((sum, item) => sum + metricValue(item, "totalStudents", "total_students"), 0);
    const scoreValues = classrooms
      .map((item) => metricValue(item, "avgReflectionScore", "avg_reflection_score"))
      .filter((score) => score > 0);
    const avgReflectionScore = scoreValues.length
      ? Number((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length).toFixed(1))
      : 0;

    return { activeStudents, completedStudents, totalStudents, avgReflectionScore };
  }, [classrooms]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/classrooms", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load classrooms");
      }
      setClassrooms(data.classrooms || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load classrooms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createClass(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: className.trim() || "Python Pilot Class" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to create classroom");
      }
      setClassName("");
      await loadData();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create classroom");
    } finally {
      setCreating(false);
    }
  }

  async function copyJoinCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(null), 1400);
  }

  return (
    <PageFrame>
      <PageContainer>
        <PageHeader
          eyebrow="Teacher workspace"
          title="Classes"
          description="Create classes, share join codes, assign lessons, and monitor student progress."
          actions={
          <form onSubmit={createClass} className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <TextInput
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Class name"
              className="sm:w-64"
            />
            <Button type="submit" loading={creating}>
              {!creating && <Plus className="h-4 w-4" />}
              Create class
            </Button>
          </form>
          }
        />

        {error && (
          <div className="mb-4">
            <Alert>
              <p className="font-medium">{error}</p>
              {error === "Not authenticated" && (
                <a href="/login" className="mt-1 inline-block text-red-800 underline underline-offset-2">Log in as a teacher</a>
              )}
            </Alert>
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-4">
          <MetricCard icon={<BookOpen className="h-4 w-4" />} label="Classes" value={classrooms.length} />
          <MetricCard icon={<Users className="h-4 w-4" />} label="Active students" value={metrics.activeStudents} />
          <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={metrics.completedStudents} />
          <MetricCard icon={<Activity className="h-4 w-4" />} label="Avg reflection" value={`${metrics.avgReflectionScore || "-"}/5`} />
        </section>

        <Panel
          className="mt-6"
          title="Class operations"
          description={`${metrics.totalStudents} total student sessions across your classes.`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-14 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading classes
            </div>
          ) : classrooms.length === 0 ? (
            <EmptyState
              title="No classes yet"
              description="Create the first class to generate a join code and start assigning Python lessons."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead className="bg-slate-50 text-left text-sm text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium">Join code</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Avg score</th>
                    <th className="px-4 py-3 font-medium">Latest activity</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classrooms.map((classroom) => {
                    const joinCode = classroom.joinCode ?? classroom.join_code ?? "";
                    const activeStudents = metricValue(classroom, "activeStudents", "active_students");
                    const completedStudents = metricValue(classroom, "completedStudents", "completed_students");
                    const avgReflectionScore = metricValue(classroom, "avgReflectionScore", "avg_reflection_score");
                    const latestActivity = classroom.latestActivityAt ?? classroom.latest_activity_at;

                    return (
                      <tr key={classroom.id} className="text-sm">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-950">{classroom.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">Latest activity: {formatDate(latestActivity)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copyJoinCode(joinCode)}
                            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-2.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
                            title="Copy join code"
                          >
                            <Clipboard className="h-4 w-4" />
                            {copiedCode === joinCode ? "Copied" : joinCode}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{activeStudents} active, {completedStudents} complete</td>
                        <td className="px-4 py-3 text-slate-600">{avgReflectionScore || "-"}/5</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(latestActivity)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => router.push(`/teacher/classes/${classroom.id}`)}
                            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                          >
                            Open class
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </PageContainer>
    </PageFrame>
  );
}
