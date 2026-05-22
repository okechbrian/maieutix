"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getDefaultLesson, getLesson } from "@/lib/curriculum";

export async function startStudentSession(formData: FormData) {
  const classroomId = String(formData.get("classroomId") ?? "");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!classroomId) return;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, full_name, role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile || profile.role !== "student") redirect("/login");

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("classroom_id")
    .eq("classroom_id", classroomId)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (enrollmentError || !enrollment) redirect("/student");

  let assignmentQuery = supabase
    .from("assignments")
    .select("id, classroom_id, lesson_id")
    .eq("classroom_id", classroomId);

  if (assignmentId) {
    assignmentQuery = assignmentQuery.eq("id", assignmentId);
  } else {
    assignmentQuery = assignmentQuery.order("created_at", { ascending: true }).limit(1);
  }

  const { data: assignment, error: assignmentError } = await assignmentQuery.maybeSingle();

  if (assignmentError || !assignment) redirect("/student");

  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("assignment_id", assignment.id)
    .eq("student_user_id", authData.user.id)
    .maybeSingle();

  if (existingSession) redirect(`/session/${existingSession.id}`);

  const lesson = getLesson(assignment.lesson_id) ?? getDefaultLesson();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      classroom_id: classroomId,
      assignment_id: assignment.id,
      lesson_id: assignment.lesson_id,
      student_user_id: authData.user.id,
      current_phase: "spec",
      code_text: lesson.starterCode,
    })
    .select("id")
    .single();

  if (sessionError || !session) redirect("/student");

  const { error: dialogueError } = await supabase.from("dialogue_turns").insert({
    session_id: session.id,
    role: "coach",
    content: `Before coding, describe your plan for "${lesson.title}". What inputs, steps, and output should your program have?`,
  });

  if (dialogueError) redirect(`/session/${session.id}`);

  redirect(`/session/${session.id}`);
}
