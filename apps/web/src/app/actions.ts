"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { createSession } from "@/lib/store";

export async function joinClassroom(formData: FormData) {
  const joinCode = formData.get("joinCode") as string;
  const fullName = formData.get("fullName") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!joinCode || !fullName || !username || !password) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // 1. Verify classroom exists and get school_id
  const { data: classroom, error: classError } = await adminClient
    .from("classrooms")
    .select("id, school_id")
    .eq("join_code", joinCode.toUpperCase())
    .single();

  if (classError || !classroom) {
    return { error: "Invalid classroom code" };
  }

  // 2. Sign up the student
  // We use a dummy email based on username to satisfy Supabase Auth requirements
  // In a real app, you'd use a custom auth provider or collect a real email
  const email = `${username}@student.maieutix.local`;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    // If the user already exists, we should probably just try to log them in
    // or tell them to use the login page.
    if (authError?.message.includes("already registered")) {
      return { error: "Username already taken. If this is you, please log in." };
    }
    return { error: authError?.message || "Failed to sign up" };
  }

  const userId = authData.user.id;

  try {
    // 3. Create public.users record
    const { error: userError } = await adminClient
      .from("users")
      .insert({
        id: userId,
        school_id: classroom.school_id,
        role: "student",
        full_name: fullName,
        username: username,
      });

    if (userError) throw new Error(userError.message);

    // 4. Create enrollment record
    const { error: enrollError } = await adminClient
      .from("enrollments")
      .insert({
        classroom_id: classroom.id,
        user_id: userId,
      });

    // It's okay if they are already enrolled (though they shouldn't be on a new signup)
    if (enrollError && !enrollError.message.includes("duplicate key")) {
      throw new Error("Failed to enroll in classroom");
    }

    // 5. Automatically create their first lesson session via the store
    // Ensure the cookies/auth state is set before calling createSession if it relies on getUser()
    // Wait, createSession currently uses supabase.auth.getUser(). 
    // Since we just signed up on the browser client, the session should be set.
    const session = await createSession({
      classroomId: classroom.id,
      studentName: fullName,
    });

    revalidatePath("/", "layout");
    
    return { redirect: `/session/${session.id}` };

  } catch (error: any) {
    return { error: error.message || "Failed to complete enrollment" };
  }
}
