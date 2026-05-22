import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { signOut } from "./auth/actions";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Maieutix | Learn through questioning",
  description: "A Socratic coding platform that teaches programming through dialogue.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthShell>{children}</AuthShell>;
}

async function AuthShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  const { data: profile } = user
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };
  const role = profile?.role as "owner" | "teacher" | "student" | undefined;

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="text-xl font-semibold text-slate-800">
              Maieutix
            </Link>
            {user ? (
              <nav className="flex flex-wrap items-center gap-2 text-sm">
                {role === "student" ? (
                  <Link href="/student" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                    Student home
                  </Link>
                ) : (
                  <Link href="/teacher" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                    Teacher dashboard
                  </Link>
                )}
                <form action={signOut}>
                  <button className="rounded-md bg-slate-900 px-3 py-2 font-medium text-white hover:bg-slate-800">
                    Sign out
                  </button>
                </form>
              </nav>
            ) : (
              <nav className="flex flex-wrap items-center gap-2 text-sm">
                <Link href="/" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  Join class
                </Link>
                <Link href="/login" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                  Log in
                </Link>
                <Link href="/signup" className="rounded-md bg-teal-600 px-3 py-2 font-medium text-white hover:bg-teal-700">
                  Teacher sign up
                </Link>
              </nav>
            )}
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
