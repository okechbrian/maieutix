"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "./actions";

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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">School Login</h2>
          <p className="text-sm text-slate-600 mt-1">Teachers use email. Students use a class username.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
          {(["teacher", "student"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={`rounded px-3 py-2 text-sm font-medium ${role === item ? "bg-white text-teal-700 shadow-sm" : "text-slate-600"}`}
            >
              {item === "teacher" ? "Teacher" : "Student"}
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium text-slate-700">
          {role === "teacher" ? "Email" : "Username"}
          <input
            name="identifier"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            placeholder={role === "teacher" ? "teacher@school.ac.ke" : "amina.python"}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            placeholder="Password"
          />
        </label>
        <button 
          disabled={loading}
          className="w-full rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Continue"}
        </button>

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
    </div>
  );
}
