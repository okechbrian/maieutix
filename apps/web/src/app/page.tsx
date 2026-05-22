"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { joinClassroom } from "./actions";

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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">Join a Classroom</h2>
          <p className="text-slate-600 mb-6">
            Students create an account with a class code from their teacher. Demo code: MAI-101.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Classroom Code
              </label>
              <input
                name="joinCode"
                type="text"
                required
                placeholder="e.g. MAI-101"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                name="fullName"
                type="text"
                required
                placeholder="Alice Kimani"
                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username
                </label>
                <input
                  name="username"
                  type="text"
                  required
                  placeholder="alice.k"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
              <p className="font-semibold mb-1">Privacy & AI Notice</p>
              <p>Your chat messages and code are analyzed by an AI coach. To protect your privacy, we recommend using a pseudonym (nickname) instead of your full real name. Teachers can see all chat history.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "Joining..." : "Join Classroom"}
            </button>
          </form>
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Teachers</h3>
            <p className="mt-1 text-sm text-slate-600">
              Create a teacher workspace to make classes, share join codes, and monitor student progress.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/signup" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Teacher sign up
              </Link>
              <Link href="/login" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Teacher log in
              </Link>
            </div>
          </div>
          <div className="mt-5 text-sm">
            <Link href="/login" className="text-slate-500 hover:text-slate-800">Already have an account? Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
