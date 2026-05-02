"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signupTeacher } from "./actions";

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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Create Pilot School</h2>
          <p className="text-sm text-slate-600 mt-1">Start a free Maieutix pilot for one teacher and one Python class.</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-slate-700">
            Full Name
            <input
              name="fullName"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
              placeholder="Jane Doe"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            School Name
            <input
              name="schoolName"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
              placeholder="Your school"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-medium text-slate-700">
            Country
            <select
              name="country"
              required
              defaultValue="UG"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            >
              <option value="UG">Uganda</option>
              <option value="KE">Kenya</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
              placeholder="teacher@school.edu"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
            placeholder="••••••••"
          />
        </label>

        <button 
          disabled={loading}
          className="w-full rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create pilot"}
        </button>
      </form>
    </div>
  );
}
