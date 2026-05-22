create policy "students create own enrolled sessions"
  on public.sessions for insert
  with check (
    student_user_id = auth.uid()
    and exists (
      select 1
      from public.enrollments
      where enrollments.classroom_id = sessions.classroom_id
        and enrollments.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.assignments
      where assignments.id = sessions.assignment_id
        and assignments.classroom_id = sessions.classroom_id
        and assignments.lesson_id = sessions.lesson_id
    )
  );

create policy "teachers manage school sessions"
  on public.sessions for all
  using (
    public.current_role() in ('owner', 'teacher')
    and exists (
      select 1
      from public.classrooms
      where classrooms.id = sessions.classroom_id
        and classrooms.school_id = public.current_school_id()
    )
  )
  with check (
    public.current_role() in ('owner', 'teacher')
    and exists (
      select 1
      from public.classrooms
      where classrooms.id = sessions.classroom_id
        and classrooms.school_id = public.current_school_id()
    )
  );

create policy "session owners add dialogue turns"
  on public.dialogue_turns for insert
  with check (
    exists (
      select 1
      from public.sessions
      where sessions.id = dialogue_turns.session_id
        and (
          sessions.student_user_id = auth.uid()
          or public.current_role() in ('owner', 'teacher')
        )
    )
  );

create policy "session owners add submissions"
  on public.submissions for insert
  with check (
    exists (
      select 1
      from public.sessions
      where sessions.id = submissions.session_id
        and (
          sessions.student_user_id = auth.uid()
          or public.current_role() in ('owner', 'teacher')
        )
    )
  );

create policy "session owners add reflection scores"
  on public.reflection_scores for insert
  with check (
    exists (
      select 1
      from public.sessions
      where sessions.id = reflection_scores.session_id
        and (
          sessions.student_user_id = auth.uid()
          or public.current_role() in ('owner', 'teacher')
        )
    )
  );

create policy "session actors record ai events"
  on public.ai_events for insert
  with check (
    exists (
      select 1
      from public.sessions
      where sessions.id = ai_events.session_id
        and sessions.classroom_id = ai_events.classroom_id
        and (
          sessions.student_user_id = auth.uid()
          or public.current_role() in ('owner', 'teacher')
        )
    )
  );
