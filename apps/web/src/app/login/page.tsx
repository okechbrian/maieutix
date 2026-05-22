"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "./actions";
import { Alert, Button, Field, Panel, PageContainer, PageFrame, TextInput, cn } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    formData.append("roleType", role);
    
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.redirect) {
      router.push(result.redirect);
    }
  }

  return (
    <PageFrame className="flex items-center py-10">
      <PageContainer className="max-w-md">
        <Panel>
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div>
          <p className="text-sm font-medium text-teal-700">Welcome back</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Log in to Maieutix</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">Teachers use email. Students use their class username.</p>
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
          {(["teacher", "student"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={cn("rounded px-3 py-2 text-sm font-medium transition", role === item ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-900")}
            >
              {item === "teacher" ? "Teacher" : "Student"}
            </button>
          ))}
        </div>

        <Field label={role === "teacher" ? "Email" : "Username"}>
          <TextInput
            name="identifier"
            required
            placeholder={role === "teacher" ? "teacher@school.ac.ke" : "amina.python"}
          />
        </Field>
        <Field label="Password">
          <TextInput
            name="password"
            type="password"
            required
            placeholder="Password"
          />
        </Field>
        <Button loading={loading} className="w-full">
          {loading ? "Signing in..." : "Continue"}
        </Button>

        <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
          <p className="text-slate-600">
            New teacher?{" "}
            <Link href="/signup" className="font-medium text-teal-700 hover:text-teal-900">
              Create a teacher account
            </Link>
          </p>
          <p className="text-slate-600">
            New student?{" "}
            <Link href="/" className="font-medium text-teal-700 hover:text-teal-900">
              Join with a class code
            </Link>
          </p>
        </div>
      </form>
        </Panel>
      </PageContainer>
    </PageFrame>
  );
}
