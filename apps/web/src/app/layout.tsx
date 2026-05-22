import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { signOut } from "./auth/actions";
import { createClient } from "@/utils/supabase/server";
import { GraduationCap, LogOut } from "lucide-react";
import { cn } from "@/components/ui";

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
      <body className="min-h-screen bg-slate-50 text-slate-950">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={role === "student" ? "/student" : user ? "/teacher" : "/"} className="inline-flex items-center gap-2 text-slate-950">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-semibold leading-5">Maieutix</span>
                <span className="block text-xs font-normal text-slate-500">Socratic coding workspace</span>
              </span>
            </Link>
            {user ? (
              <nav className="flex flex-wrap items-center gap-2 text-sm">
                <Link
                  href={role === "student" ? "/student" : "/teacher"}
                  className="rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                >
                  {role === "student" ? "Student home" : "Classes"}
                </Link>
                <form action={signOut}>
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </nav>
            ) : (
              <nav className="flex flex-wrap items-center gap-2 text-sm">
                <Link href="/" className={cn("rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950")}>
                  Join class
                </Link>
                <Link href="/login" className="rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950">
                  Log in
                </Link>
                <Link href="/signup" className="rounded-md bg-teal-600 px-3 py-2 font-medium text-white hover:bg-teal-700">
                  Teacher sign up
                </Link>
              </nav>
            )}
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
