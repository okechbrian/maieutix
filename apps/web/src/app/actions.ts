"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { getDefaultLesson, getLesson } from "@/lib/curriculum";

export async function joinClassroom(formData: FormData) {
  const joinCode = String(formData.get("joinCode") ?? "").trim().toUpperCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!joinCode || !fullName || !username || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  if (!/^[a-z0-9._-]+$/.test(username)) {
    return { error: "Username can only use letters, numbers, dots, underscores, and hyphens" };
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const email = `${username}@student.maieutix.local`;
  let userId: string | undefined;
  let sessionId: string | undefined;

  try {
    const { data: classroom, error: classError } = await adminClient
      .from("classrooms")
      .select("id, school_id")
      .eq("join_code", joinCode)
      .single();

    if (classError || !classroom) {
      return { error: "Invalid classroom code" };
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username },
    });

    if (authError || !authData.user) {
      if (authError?.message.toLowerCase().includes("already")) {
        return { error: "Username already taken. If this is you, please log in." };
      }
      return { error: authError?.message || "Failed to create student account" };
    }

    userId = authData.user.id;

    const { error: userError } = await adminClient
      .from("users")
      .insert({
        id: userId,
        school_id: classroom.school_id,
        role: "student",
        full_name: fullName,
        username,
        email,
      });

    if (userError) {
      if (userError.message.toLowerCase().includes("duplicate key")) {
        throw new Error("Username already taken. If this is you, please log in.");
      }
      throw new Error(userError.message);
    }

    const { error: enrollError } = await adminClient
      .from("enrollments")
      .insert({
        classroom_id: classroom.id,
        user_id: userId,
      });

    if (enrollError && !enrollError.message.includes("duplicate key")) {
      throw new Error("Failed to enroll in classroom");
    }

    const { data: existingAssignment, error: assignmentReadError } = await adminClient
      .from("assignments")
      .select("id, lesson_id")
      .eq("classroom_id", classroom.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (assignmentReadError) throw new Error(assignmentReadError.message);

    let assignment = existingAssignment;
    if (!assignment) {
      const defaultLesson = getDefaultLesson();
      const { data: lessonExists, error: lessonError } = await adminClient
        .from("lessons")
        .select("id")
        .eq("id", defaultLesson.id)
        .maybeSingle();

      if (lessonError) throw new Error(lessonError.message);
      if (!lessonExists) throw new Error("No starter lesson is configured for this class");

      const { data: newAssignment, error: assignmentError } = await adminClient
        .from("assignments")
        .insert({
          classroom_id: classroom.id,
          lesson_id: defaultLesson.id,
          title: defaultLesson.title,
        })
        .select("id, lesson_id")
        .single();

      if (assignmentError) throw new Error(assignmentError.message);
      assignment = newAssignment;
    }

    const lesson = getLesson(assignment.lesson_id) ?? getDefaultLesson();
    const { data: session, error: sessionError } = await adminClient
      .from("sessions")
      .insert({
        classroom_id: classroom.id,
        assignment_id: assignment.id,
        lesson_id: assignment.lesson_id,
        student_user_id: userId,
        current_phase: "spec",
        code_text: lesson.starterCode,
      })
      .select("id")
      .single();

    if (sessionError) throw new Error(sessionError.message);
    sessionId = session.id;

    const { error: dialogueError } = await adminClient
      .from("dialogue_turns")
      .insert({
        session_id: session.id,
        role: "coach",
        content: `Before coding, describe your plan for "${lesson.title}". What inputs, steps, and output should your program have?`,
      });

    if (dialogueError) throw new Error(dialogueError.message);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { error: "Student account was created, but automatic login failed. Please log in with your username and password." };
    }

    revalidatePath("/", "layout");
    revalidatePath("/student", "layout");
    
    return { redirect: `/session/${sessionId}` };

  } catch (error: unknown) {
    if (userId) {
      if (sessionId) {
        await adminClient.from("dialogue_turns").delete().eq("session_id", sessionId);
        await adminClient.from("sessions").delete().eq("id", sessionId);
      }
      await adminClient.from("enrollments").delete().eq("user_id", userId);
      await adminClient.from("users").delete().eq("id", userId);
      await adminClient.auth.admin.deleteUser(userId);
    }

    return { error: error instanceof Error ? error.message : "Failed to complete enrollment" };
  }
}
