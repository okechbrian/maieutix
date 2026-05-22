create policy "students see own enrollments"
  on public.enrollments for select
  using (user_id = auth.uid());

create policy "teachers see school enrollments"
  on public.enrollments for select
  using (
    public.current_role() in ('owner', 'teacher')
    and exists (
      select 1
      from public.classrooms
      where classrooms.id = enrollments.classroom_id
        and classrooms.school_id = public.current_school_id()
    )
  );
