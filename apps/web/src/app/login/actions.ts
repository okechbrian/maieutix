"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function login(formData: FormData) {
  const identifier = formData.get("identifier") as string;
  const password = formData.get("password") as string;
  const roleType = formData.get("roleType") as "teacher" | "student";

  if (!identifier || !password) {
    return { error: "Identifier and password are required" };
  }

  const supabase = await createClient();

  let email = identifier;

  // If student uses a username instead of an email, we need to look up their email
  // since Supabase Auth defaults to email/password.
  // Note: For a fully robust system, you'd want to use Supabase custom claims or 
  // allow sign in with username if configured. For simplicity, if they select 'student'
  // and don't provide an @, we'll try to find them in the users table first.
  if (roleType === "student" && !identifier.includes("@")) {
    // This requires the users table to be readable by anon by username, 
    // or we use the admin client just for this lookup.
    // However, looking up an email by username leaks emails.
    // A better approach for demo is to append a dummy domain if they use username.
    email = `${identifier}@student.maieutix.local`; 
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: "Invalid credentials" };
  }

  // Fetch the user's role to determine redirect
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  if (userError || !userData) {
    // User exists in auth but not in our public schema
    return { error: "User profile not found. Please contact an administrator." };
  }

  revalidatePath("/", "layout");

  if (userData.role === "owner" || userData.role === "teacher") {
    return { redirect: "/teacher" };
  } else {
    // Redirect to the student dashboard (which we might need to build, or route to `/student`)
    return { redirect: "/student" };
  }
}
