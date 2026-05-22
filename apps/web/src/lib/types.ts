export type Role = "owner" | "teacher" | "student";

export type LessonPhase =
  | "spec"
  | "approved"
  | "editing"
  | "submitted"
  | "reflecting"
  | "complete";

export interface School {
  id: string;
  name: string;
  country: "UG" | "KE";
  pilotEndsAt: string;
}

export interface User {
  id: string;
  schoolId: string;
  role: Role;
  name: string;
  email?: string;
  username?: string;
}

export interface Classroom {
  id: string;
  schoolId: string;
  teacherId: string;
  name: string;
  joinCode: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  summary: string;
  prompt: string;
  expectedConcepts: string[];
  starterCode: string;
  visibleTests: string[];
  reflectionPrompts: string[];
  teacherNotes: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Assignment {
  id: string;
  classroomId: string;
  lessonId: string;
  title: string;
  dueAt?: string;
  createdAt: string;
}

export interface LearningSession {
  id: string;
  classroomId: string;
  assignmentId: string;
  lessonId: string;
  studentUserId: string;
  studentName: string;
  currentPhase: LessonPhase;
  specText: string | null;
  codeText: string | null;
  testOutput: string | null;
  reflectionText: string | null;
  reflectionScore: number | null;
  startedAt: string;
  updatedAt: string;
}

export interface DialogueTurn {
  id: string;
  sessionId: string;
  role: "student" | "coach" | "system";
  content: string;
  timestamp: string;
}

export interface Submission {
  id: string;
  sessionId: string;
  codeText: string;
  gapAnalysis: Record<string, string>;
  reflectionPrompts: string[];
  createdAt: string;
}

export interface ReflectionScore {
  id: string;
  sessionId: string;
  score: number;
  message: string;
  createdAt: string;
}

export type TeacherReviewCategory = "general" | "spec" | "code" | "reflection";
export type TeacherReviewStatus = "reviewed" | "needs_attention";

export interface TeacherReview {
  id: string;
  sessionId: string;
  teacherUserId: string;
  category: TeacherReviewCategory;
  status: TeacherReviewStatus;
  message: string;
  createdAt: string;
}
