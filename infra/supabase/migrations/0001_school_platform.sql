create extension if not exists pgcrypto;

create type public.app_role as enum ('owner', 'teacher', 'student');
create type public.lesson_phase as enum ('spec', 'approved', 'editing', 'submitted', 'reflecting', 'complete');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null check (country in ('UG', 'KE')),
  pilot_ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role public.app_role not null,
  full_name text not null,
  username text,
  email text,
  created_at timestamptz not null default now(),
  unique (school_id, username)
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.users(id),
  name text not null,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (classroom_id, user_id)
);

create table public.courses (
  id text primary key,
  title text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  slug text not null,
  title text not null,
  prompt text not null,
  expected_concepts text[] not null default '{}',
  starter_code text not null default '',
  visible_tests jsonb not null default '[]'::jsonb,
  reflection_prompts jsonb not null default '[]'::jsonb,
  teacher_notes text not null default ''
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  lesson_id text not null references public.lessons(id),
  title text not null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  lesson_id text not null references public.lessons(id),
  student_user_id uuid not null references public.users(id) on delete cascade,
  current_phase public.lesson_phase not null default 'spec',
  spec_text text,
  code_text text,
  test_output text,
  reflection_text text,
  reflection_score integer check (reflection_score between 1 and 5),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dialogue_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  role text not null check (role in ('student', 'coach', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  code_text text not null,
  gap_analysis jsonb not null default '{}'::jsonb,
  reflection_prompts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reflection_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  message text not null,
  created_at timestamptz not null default now()
);

create table public.ai_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  classroom_id uuid references public.classrooms(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  model text not null,
  status text not null,
  prompt_tokens integer,
  completion_tokens integer,
  error text,
  created_at timestamptz not null default now()
);

alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.classrooms enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.sessions enable row level security;
alter table public.dialogue_turns enable row level security;
alter table public.submissions enable row level security;
alter table public.reflection_scores enable row level security;
alter table public.ai_events enable row level security;

create or replace function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.users where id = auth.uid()
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create policy "school members see their school"
  on public.schools for select
  using (id = public.current_school_id());

create policy "users see same school users"
  on public.users for select
  using (school_id = public.current_school_id());

create policy "teachers manage same school classrooms"
  on public.classrooms for all
  using (school_id = public.current_school_id() and public.current_role() in ('owner', 'teacher'))
  with check (school_id = public.current_school_id() and public.current_role() in ('owner', 'teacher'));

create policy "students see enrolled classrooms"
  on public.classrooms for select
  using (
    school_id = public.current_school_id()
    and exists (
      select 1 from public.enrollments
      where enrollments.classroom_id = classrooms.id
      and enrollments.user_id = auth.uid()
    )
  );

create policy "members see assignments in their school"
  on public.assignments for select
  using (
    exists (
      select 1 from public.classrooms
      where classrooms.id = assignments.classroom_id
      and classrooms.school_id = public.current_school_id()
    )
  );

create policy "teachers manage assignments"
  on public.assignments for all
  using (public.current_role() in ('owner', 'teacher'))
  with check (public.current_role() in ('owner', 'teacher'));

create policy "students see own sessions"
  on public.sessions for select
  using (student_user_id = auth.uid() or public.current_role() in ('owner', 'teacher'));

create policy "students update own sessions"
  on public.sessions for update
  using (student_user_id = auth.uid())
  with check (student_user_id = auth.uid());

create policy "session children visible through session"
  on public.dialogue_turns for select
  using (exists (select 1 from public.sessions where sessions.id = dialogue_turns.session_id and (sessions.student_user_id = auth.uid() or public.current_role() in ('owner', 'teacher'))));

create policy "session submissions visible through session"
  on public.submissions for select
  using (exists (select 1 from public.sessions where sessions.id = submissions.session_id and (sessions.student_user_id = auth.uid() or public.current_role() in ('owner', 'teacher'))));

create policy "session reflections visible through session"
  on public.reflection_scores for select
  using (exists (select 1 from public.sessions where sessions.id = reflection_scores.session_id and (sessions.student_user_id = auth.uid() or public.current_role() in ('owner', 'teacher'))));

create policy "teachers see ai events in school"
  on public.ai_events for select
  using (school_id = public.current_school_id() and public.current_role() in ('owner', 'teacher'));
