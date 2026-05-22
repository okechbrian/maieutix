create table public.teacher_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  teacher_user_id uuid not null references public.users(id) on delete cascade,
  category text not null check (category in ('general', 'spec', 'code', 'reflection')),
  status text not null check (status in ('reviewed', 'needs_attention')),
  message text not null,
  created_at timestamptz not null default now()
);

create index teacher_reviews_session_created_idx
  on public.teacher_reviews (session_id, created_at desc);

alter table public.teacher_reviews enable row level security;

create policy "teachers read school reviews"
  on public.teacher_reviews for select
  using (
    public.current_role() in ('owner', 'teacher')
    and exists (
      select 1
      from public.sessions
      join public.classrooms on classrooms.id = sessions.classroom_id
      where sessions.id = teacher_reviews.session_id
        and classrooms.school_id = public.current_school_id()
    )
  );

create policy "students read own reviews"
  on public.teacher_reviews for select
  using (
    exists (
      select 1
      from public.sessions
      where sessions.id = teacher_reviews.session_id
        and sessions.student_user_id = auth.uid()
    )
  );

create policy "teachers create school reviews"
  on public.teacher_reviews for insert
  with check (
    teacher_user_id = auth.uid()
    and public.current_role() in ('owner', 'teacher')
    and exists (
      select 1
      from public.sessions
      join public.classrooms on classrooms.id = sessions.classroom_id
      where sessions.id = teacher_reviews.session_id
        and classrooms.school_id = public.current_school_id()
    )
  );
