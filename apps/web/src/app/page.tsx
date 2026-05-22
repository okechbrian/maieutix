"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { joinClassroom } from "./actions";
import { Alert, Button, Field, Panel, PageContainer, PageFrame, TextInput } from "@/components/ui";

export default function JoinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await joinClassroom(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.redirect) {
      router.push(result.redirect);
    }
  };

  return (
    <PageFrame className="py-10">
      <PageContainer className="max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="pt-2">
            <p className="text-sm font-medium text-teal-700">Student onboarding</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Join your class and start the assigned coding lesson.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Maieutix guides students from a clear specification to code and reflection, while teachers monitor progress from a classroom workspace.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <UserRound className="h-5 w-5 text-teal-700" />
                <p className="mt-3 text-sm font-medium text-slate-950">Student account</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">Use the class code and a username from your teacher.</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <ShieldCheck className="h-5 w-5 text-teal-700" />
                <p className="mt-3 text-sm font-medium text-slate-950">Guided AI coach</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">The coach asks questions and checks reasoning before code.</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <UsersRound className="h-5 w-5 text-teal-700" />
                <p className="mt-3 text-sm font-medium text-slate-950">Teacher visibility</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">Teachers can review progress, specs, code, and reflections.</p>
              </div>
            </div>
          </div>

          <Panel className="lg:sticky lg:top-24">
            <div className="p-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Join a class</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Create your student login and start the first available assignment.</p>
              </div>

              {error && <div className="mt-4"><Alert>{error}</Alert></div>}

              <form onSubmit={handleJoin} className="mt-5 space-y-4">
                <Field label="Class code">
                  <TextInput name="joinCode" type="text" required placeholder="e.g. MAI-101" className="uppercase" />
                </Field>

                <Field label="Display name" helper="Use the name your teacher will recognize.">
                  <TextInput name="fullName" type="text" required placeholder="Alice Kimani" />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Username">
                    <TextInput name="username" type="text" required placeholder="alice.k" />
                  </Field>
                  <Field label="Password">
                    <TextInput name="password" type="password" required minLength={6} placeholder="Password" />
                  </Field>
                </div>

                <div className="rounded-md border border-teal-100 bg-teal-50 p-3 text-xs leading-5 text-teal-900">
                  Chat messages, specs, code, and reflections are visible to your teacher and may be analyzed by the AI coach.
                </div>

                <Button type="submit" loading={loading} className="w-full">
                  Join class
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-5 border-t border-slate-200 pt-4 text-sm">
                <Link href="/login" className="font-medium text-teal-700 hover:text-teal-900">Already have an account? Log in</Link>
              </div>
            </div>
          </Panel>
        </div>

        <Panel className="mt-6" title="Teacher workspace" description="Create classes, assign Python lessons, share join codes, and track student reasoning.">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-600">Teachers use a separate account with school-level classroom management.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/signup" className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Create teacher account
              </Link>
              <Link href="/login" className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Log in
              </Link>
            </div>
          </div>
        </Panel>
      </PageContainer>
    </PageFrame>
  );
}
