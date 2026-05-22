import { courses, getDefaultLesson, getLesson } from "./curriculum";
import { analyzeReasoningSignals } from "./maieutic";
import { createClient } from "../utils/supabase/server";
import type {
  Classroom,
  DialogueTurn,
  LearningSession,
  TeacherReview,
  TeacherReviewCategory,
  TeacherReviewStatus,
} from "./types";

type SessionRow = {
  id: string;
  classroom_id: string;
  assignment_id: string;
  lesson_id: string;
  student_user_id: string;
  current_phase: LearningSession["currentPhase"];
  spec_text: string | null;
  code_text: string | null;
  test_output: string | null;
  reflection_text: string | null;
  reflection_score: number | null;
  started_at: string;
  updated_at: string;
  users?: { full_name: string | null } | null;
};

type ClassroomRow = {
  id: string;
  school_id: string;
  teacher_id: string;
  name: string;
  join_code: string;
  created_at: string;
};

type AssignmentRow = {
  id: string;
  classroom_id: string;
  lesson_id: string;
  title: string;
  due_at: string | null;
  created_at: string;
};

type AiEventInput = {
  sessionId: string;
  model: string;
  status: string;
  responseId?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  error?: string;
};

type TeacherReviewRow = {
  id: string;
  session_id: string;
  teacher_user_id: string;
  category: TeacherReviewCategory;
  status: TeacherReviewStatus;
  message: string;
  created_at: string;
};

type SubmissionRow = {
  id: string;
  session_id: string;
  code_text: string;
  gap_analysis: Record<string, string>;
  reflection_prompts: string[];
  created_at: string;
};

function mapSession(row: SessionRow): LearningSession {
  return {
    id: row.id,
    classroomId: row.classroom_id,
    assignmentId: row.assignment_id,
    lessonId: row.lesson_id,
    studentUserId: row.student_user_id,
    studentName: row.users?.full_name || "Unknown", // Assuming a join with users table
    currentPhase: row.current_phase,
    specText: row.spec_text,
    codeText: row.code_text,
    testOutput: row.test_output,
    reflectionText: row.reflection_text,
    reflectionScore: row.reflection_score,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
  };
}

function mapClassroom(row: ClassroomRow): Classroom {
  return {
    id: row.id,
    schoolId: row.school_id,
    teacherId: row.teacher_id,
    name: row.name,
    joinCode: row.join_code,
    createdAt: row.created_at,
  };
}

function mapTeacherReview(row: TeacherReviewRow): TeacherReview {
  return {
    id: row.id,
    sessionId: row.session_id,
    teacherUserId: row.teacher_user_id,
    category: row.category,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
  };
}

export function listCourses() {
  return courses;
}

export async function listClassrooms() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from('classrooms').select('*');
  if (error) throw new Error(error.message);
  
  const classrooms = data.map(mapClassroom);
  
  // To get stats, we should ideally use a view or RPC, but for now we'll fetch sessions too
  const { data: sessionsData } = await supabase.from('sessions').select('id, classroom_id, current_phase, reflection_score, updated_at');
  
  return classrooms.map(classroom => {
    const sessions = (sessionsData || []).filter(s => s.classroom_id === classroom.id);
    const scores = sessions.map(s => s.reflection_score).filter((s): s is number => typeof s === 'number');
    const activeStudents = sessions.filter(s => s.current_phase !== 'complete').length;
    const completedStudents = sessions.filter(s => s.current_phase === 'complete').length;
    const avgReflectionScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : 0;
    const latestUpdatedAt = sessions
      .map((session) => session.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
    
    return {
      ...classroom,
      join_code: classroom.joinCode,
      active_students: activeStudents,
      activeStudents: activeStudents,
      completed_students: completedStudents,
      completedStudents: completedStudents,
      total_students: sessions.length,
      totalStudents: sessions.length,
      avg_reflection_score: avgReflectionScore,
      avgReflectionScore: avgReflectionScore,
      latest_activity_at: latestUpdatedAt,
      latestActivityAt: latestUpdatedAt,
    };
  });
}

export async function getClassroom(classroomIdOrCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('classrooms')
    .select('*')
    .or(`id.eq.${classroomIdOrCode},join_code.ilike.${classroomIdOrCode}`)
    .single();
    
  if (error || !data) return undefined;
  return mapClassroom(data);
}

export async function createClassroom(name: string) {
  const supabase = await createClient();
  
  // We need to know the teacher's ID and school ID. 
  // In a real app, this comes from the authenticated user.
  // For the sake of the migration without full auth wired up everywhere yet,
  // we assume the demo teacher exists or we fetch the current user.
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");
  
  const { data: userRecord } = await supabase.from('users').select('school_id').eq('id', userData.user.id).single();
  if (!userRecord) throw new Error("User record not found");

  const joinCode = `MAI-${Math.floor(100 + Math.random() * 900)}`;

  const { data, error } = await supabase.from('classrooms').insert({
    school_id: userRecord.school_id,
    teacher_id: userData.user.id,
    name,
    join_code: joinCode
  }).select().single();
  
  if (error) throw new Error(error.message);
  
  const classroom = mapClassroom(data);
  
  // Create default assignment
  await createAssignment(classroom.id, getDefaultLesson().id);
  
  return classroom;
}

export async function listAssignments(classroomId?: string) {
  const supabase = await createClient();
  let query = supabase.from('assignments').select('*');
  if (classroomId) {
    query = query.eq('classroom_id', classroomId);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const assignmentIds = data.map((row: AssignmentRow) => row.id);
  const { data: sessionsData } = assignmentIds.length
    ? await supabase
      .from('sessions')
      .select('assignment_id, current_phase, reflection_score')
      .in('assignment_id', assignmentIds)
    : { data: [] };
  
  return data.map((row: AssignmentRow) => {
    const sessions = (sessionsData || []).filter((session) => session.assignment_id === row.id);
    const scores = sessions.map((session) => session.reflection_score).filter((score): score is number => typeof score === 'number');
    const completedStudents = sessions.filter((session) => session.current_phase === 'complete').length;
    const activeStudents = sessions.filter((session) => session.current_phase !== 'complete').length;
    const avgReflectionScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : 0;

    return {
      id: row.id,
      classroomId: row.classroom_id,
      classroom_id: row.classroom_id,
      lessonId: row.lesson_id,
      lesson_id: row.lesson_id,
      title: row.title,
      dueAt: row.due_at,
      due_at: row.due_at,
      createdAt: row.created_at,
      created_at: row.created_at,
      activeStudents,
      active_students: activeStudents,
      completedStudents,
      completed_students: completedStudents,
      totalStudents: sessions.length,
      total_students: sessions.length,
      avgReflectionScore,
      avg_reflection_score: avgReflectionScore,
      lesson: getLesson(row.lesson_id)
    };
  });
}

export async function createAssignment(classroomId: string, lessonId: string) {
  const supabase = await createClient();
  const lesson = getLesson(lessonId) ?? getDefaultLesson();
  
  const { data, error } = await supabase.from('assignments').insert({
    classroom_id: classroomId,
    lesson_id: lesson.id,
    title: lesson.title
  }).select().single();
  
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    classroomId: data.classroom_id,
    lessonId: data.lesson_id,
    title: data.title,
    createdAt: data.created_at,
  };
}

export async function createSession(input: {
  classroomId: string;
  studentName: string;
  studentUserId?: string;
  assignmentId?: string;
  lessonId?: string;
}) {
  const supabase = await createClient();
  const classroom = await getClassroom(input.classroomId);
  if (!classroom) throw new Error("Classroom not found");
  
  let assignmentId = input.assignmentId;
  if (!assignmentId) {
    const assignments = await listAssignments(classroom.id);
    assignmentId = assignments[0]?.id;
  }
  if (!assignmentId) {
    const assignment = await createAssignment(classroom.id, input.lessonId ?? getDefaultLesson().id);
    assignmentId = assignment.id;
  }
  
  const assignments = await listAssignments(classroom.id);
  const assignment = assignments.find(a => a.id === assignmentId);
  const lessonId = input.lessonId ?? assignment?.lessonId ?? getDefaultLesson().id;
  const lesson = getLesson(lessonId) ?? getDefaultLesson();
  
  // Ensure user is authenticated. In this simplified model, 
  // student needs to be signed up. If anonymous auth is not used, 
  // we might need to handle user creation first.
  const { data: userData } = input.studentUserId
    ? { data: { user: { id: input.studentUserId } } }
    : await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated as student");

  const { data: sessionData, error: sessionError } = await supabase.from('sessions').insert({
    classroom_id: classroom.id,
    assignment_id: assignmentId,
    lesson_id: lesson.id,
    student_user_id: userData.user.id,
    current_phase: 'spec',
    code_text: lesson.starterCode
  }).select('*, users(full_name)').single();
  
  if (sessionError) throw new Error(sessionError.message);
  
  const session = mapSession(sessionData);
  
  await addDialogueTurn(session.id, "coach", `Before coding, describe your plan for "${lesson.title}". What inputs, steps, and output should your program have?`);
  
  return session;
}

export async function getSession(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('sessions').select('*, users(full_name)').eq('id', sessionId).single();
  if (error || !data) return undefined;
  return mapSession(data);
}

export async function updateSession(sessionId: string, patch: Partial<LearningSession>) {
  const supabase = await createClient();
  
  const dbPatch: {
    current_phase?: LearningSession["currentPhase"];
    spec_text?: string | null;
    code_text?: string | null;
    test_output?: string | null;
    reflection_text?: string | null;
    reflection_score?: number | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (patch.currentPhase !== undefined) dbPatch.current_phase = patch.currentPhase;
  if (patch.specText !== undefined) dbPatch.spec_text = patch.specText;
  if (patch.codeText !== undefined) dbPatch.code_text = patch.codeText;
  if (patch.testOutput !== undefined) dbPatch.test_output = patch.testOutput;
  if (patch.reflectionText !== undefined) dbPatch.reflection_text = patch.reflectionText;
  if (patch.reflectionScore !== undefined) dbPatch.reflection_score = patch.reflectionScore;

  const { data, error } = await supabase.from('sessions').update(dbPatch).eq('id', sessionId).select('*, users(full_name)').single();
  if (error) throw new Error(error.message);
  return mapSession(data);
}

export async function addDialogueTurn(sessionId: string, role: DialogueTurn["role"], content: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('dialogue_turns').insert({
    session_id: sessionId,
    role,
    content
  }).select().single();
  
  if (error) throw new Error(error.message);
  
  return {
    id: data.id,
    sessionId: data.session_id,
    role: data.role as DialogueTurn["role"],
    content: data.content,
    timestamp: data.created_at,
  };
}

export async function listDialogue(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('dialogue_turns').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  
  return data.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    role: row.role as DialogueTurn["role"],
    content: row.content,
    timestamp: row.created_at,
  }));
}

export async function listTeacherReviews(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_reviews")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as TeacherReviewRow[]).map(mapTeacherReview);
}

export async function createTeacherReview(input: {
  sessionId: string;
  category: TeacherReviewCategory;
  status: TeacherReviewStatus;
  message: string;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const message = input.message.trim();
  if (message.length < 3) throw new Error("Feedback message is required");

  const { data, error } = await supabase
    .from("teacher_reviews")
    .insert({
      session_id: input.sessionId,
      teacher_user_id: userData.user.id,
      category: input.category,
      status: input.status,
      message,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapTeacherReview(data as TeacherReviewRow);
}

export async function getLatestSubmission(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as SubmissionRow;
  return {
    id: row.id,
    sessionId: row.session_id,
    codeText: row.code_text,
    gapAnalysis: row.gap_analysis,
    reflectionPrompts: row.reflection_prompts,
    createdAt: row.created_at,
  };
}

export async function addSubmission(sessionId: string, codeText: string, gapAnalysis: Record<string, string>, reflectionPrompts: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('submissions').insert({
    session_id: sessionId,
    code_text: codeText,
    gap_analysis: gapAnalysis,
    reflection_prompts: reflectionPrompts
  }).select().single();
  
  if (error) throw new Error(error.message);
  
  return {
    id: data.id,
    sessionId: data.session_id,
    codeText: data.code_text,
    gapAnalysis: data.gap_analysis,
    reflectionPrompts: data.reflection_prompts as string[],
    createdAt: data.created_at,
  };
}

export async function addReflectionScore(sessionId: string, score: number, message: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('reflection_scores').insert({
    session_id: sessionId,
    score,
    message
  }).select().single();
  
  if (error) throw new Error(error.message);
  
  return {
    id: data.id,
    sessionId: data.session_id,
    score: data.score,
    message: data.message,
    createdAt: data.created_at,
  };
}

export async function listClassroomStudents(classroomId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('sessions').select('*, users(full_name)').eq('classroom_id', classroomId);
  if (error) throw new Error(error.message);

  const sessionIds = data.map((row) => row.id);
  const { data: reviewsData } = sessionIds.length
    ? await supabase
      .from("teacher_reviews")
      .select("session_id, status, category, message, created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false })
    : { data: [] };

  const latestReviews = new Map<string, { status: string; category: string; message: string; created_at: string }>();
  for (const review of reviewsData || []) {
    if (!latestReviews.has(review.session_id)) {
      latestReviews.set(review.session_id, review);
    }
  }
  
  return data.map(row => {
    const session = mapSession(row);
    const latestReview = latestReviews.get(session.id);
    return {
      id: session.id,
      student_name: session.studentName,
      studentName: session.studentName,
      current_phase: session.currentPhase,
      currentPhase: session.currentPhase,
      spec_text: session.specText,
      specText: session.specText,
      code_text: session.codeText,
      codeText: session.codeText,
      reflection_score: session.reflectionScore,
      reflectionScore: session.reflectionScore,
      review_status: latestReview?.status ?? null,
      reviewStatus: latestReview?.status ?? null,
      review_category: latestReview?.category ?? null,
      reviewCategory: latestReview?.category ?? null,
      latest_review_at: latestReview?.created_at ?? null,
      latestReviewAt: latestReview?.created_at ?? null,
      latest_review_message: latestReview?.message ?? null,
      latestReviewMessage: latestReview?.message ?? null,
      started_at: session.startedAt,
      startedAt: session.startedAt,
      updated_at: session.updatedAt,
      updatedAt: session.updatedAt,
    };
  });
}

export async function getClassroomInsights(classroomId: string) {
  const supabase = await createClient();
  const { data: sessionsData, error } = await supabase.from('sessions').select('*, users(full_name)').eq('classroom_id', classroomId);
  if (error) throw new Error(error.message);
  
  const sessions = sessionsData.map(mapSession);
  
  const phaseDistribution = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.currentPhase] = (acc[session.currentPhase] ?? 0) + 1;
    return acc;
  }, {});
  
  const scores = sessions
    .map((session) => session.reflectionScore)
    .filter((score): score is number => typeof score === "number");
  const avgScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)) : 0;
  
  // Get all submissions for the classroom
  const { data: submissionsData } = await supabase.from('submissions')
    .select('*, sessions!inner(classroom_id)')
    .eq('sessions.classroom_id', classroomId)
    .order('created_at', { ascending: false });
    
  const latestSubmissionsBySession = new Map<string, Record<string, string>>();
  if (submissionsData) {
    for (const sub of submissionsData) {
      if (!latestSubmissionsBySession.has(sub.session_id)) {
        latestSubmissionsBySession.set(sub.session_id, sub.gap_analysis as Record<string, string>);
      }
    }
  }

  const sessionsInput = sessions.map(session => ({
    ...session,
    latestGapAnalysis: latestSubmissionsBySession.get(session.id)
  }));
  
  const { reasoningSignals, exemplarReflections } = analyzeReasoningSignals(sessionsInput);
  
  const struggles = reasoningSignals.map((signal) => `${signal.label}: ${signal.count} student${signal.count === 1 ? "" : "s"}`);
  
  const latestSubmission = submissionsData?.[0];
  
  return {
    struggles,
    reasoning_signals: reasoningSignals,
    reasoningSignals,
    exemplar_reflections: exemplarReflections,
    exemplarReflections,
    phase_distribution: phaseDistribution,
    phaseDistribution,
    avg_score: avgScore,
    avgScore,
    most_common_gap: latestSubmission ? Object.values(latestSubmission.gap_analysis as Record<string, string>)[0] ?? "No common gap yet" : "No common gap yet",
    mostCommonGap: latestSubmission ? Object.values(latestSubmission.gap_analysis as Record<string, string>)[0] ?? "No common gap yet" : "No common gap yet",
    total_students: sessions.length,
    totalStudents: sessions.length,
  };
}

export async function addAiEvent(event: AiEventInput) {
  const supabase = await createClient();
  const { data: session } = await supabase.from('sessions').select('classroom_id').eq('id', event.sessionId).single();
  const { data: classroom } = session ? await supabase.from('classrooms').select('school_id').eq('id', session.classroom_id).single() : { data: null };

  await supabase.from('ai_events').insert({
    session_id: event.sessionId,
    classroom_id: session?.classroom_id,
    school_id: classroom?.school_id,
    model: event.model,
    status: event.status,
    prompt_tokens: event.prompt_tokens,
    completion_tokens: event.completion_tokens,
    error: event.error,
  });
}

export async function getAiAuditEvents() {
  const supabase = await createClient();
  const { data } = await supabase.from('ai_events').select('*').order('created_at', { ascending: false });
  return data || [];
}
