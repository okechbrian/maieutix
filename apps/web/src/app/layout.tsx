import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { signOut } from "./auth/actions";
import { createClient } from "@/utils/supabase/server";
import { GraduationCap, LogOut } from "lucide-react";
import { cn } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    const stored = localStorage.getItem("maieutix-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={role === "student" ? "/student" : user ? "/teacher" : "/"} className="inline-flex items-center gap-2 text-slate-950 dark:text-slate-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-teal-500 dark:text-slate-950">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-base font-semibold leading-5">Maieutix</span>
                <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">Socratic coding workspace</span>
              </span>
            </Link>
            {user ? (
              <nav className="flex flex-wrap items-center gap-2 text-sm">
                <ThemeToggle />
                <Link
                  href={role === "student" ? "/student" : "/teacher"}
                  className="rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                >
                  {role === "student" ? "Student home" : "Classes"}
                </Link>
                <form action={signOut}>
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </nav>
            ) : (
              <nav className="flex flex-wrap items-center gap-2 text-sm">
                <ThemeToggle />
                <Link href="/" className={cn("rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50")}>
                  Join class
                </Link>
                <Link href="/login" className="rounded-md px-3 py-2 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50">
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
