"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupTeacher } from "./actions";
import { Alert, Button, Field, Panel, PageContainer, PageFrame, TextInput } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(event.currentTarget);
    const result = await signupTeacher(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/teacher");
    }
  }

  return (
    <PageFrame className="flex items-center py-10">
      <PageContainer className="max-w-2xl">
        <Panel>
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <div>
          <p className="text-sm font-medium text-teal-700">Teacher onboarding</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Create a teacher workspace</h1>
          <p className="mt-1 text-sm leading-6 text-slate-600">Set up your school, create classes, and assign the Python beginner curriculum.</p>
        </div>
        
        {error && <Alert>{error}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <TextInput
              name="fullName"
              required
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="School name">
            <TextInput
              name="schoolName"
              required
              placeholder="Your school"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country">
            <select
              name="country"
              required
              defaultValue="UG"
              className="min-h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            >
              <option value="UG">Uganda</option>
              <option value="KE">Kenya</option>
            </select>
          </Field>
          <Field label="Email">
            <TextInput
              name="email"
              type="email"
              required
              placeholder="teacher@school.edu"
            />
          </Field>
        </div>

        <Field label="Password" helper="Use at least 6 characters.">
          <TextInput
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Password"
          />
        </Field>

        <Button loading={loading} className="w-full">
          {loading ? "Creating..." : "Create teacher workspace"}
        </Button>

        <div className="space-y-2 border-t border-slate-200 pt-4 text-sm">
          <p className="text-slate-600">
            Already have a teacher account?{" "}
            <Link href="/login" className="font-medium text-teal-700 hover:text-teal-900">
              Log in
            </Link>
          </p>
          <p className="text-slate-600">
            Student joining a class?{" "}
            <Link href="/" className="font-medium text-teal-700 hover:text-teal-900">
              Use your class code
            </Link>
          </p>
        </div>
      </form>
        </Panel>
      </PageContainer>
    </PageFrame>
  );
}
