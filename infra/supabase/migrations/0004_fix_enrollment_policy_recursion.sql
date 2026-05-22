drop policy if exists "teachers see school enrollments" on public.enrollments;

create policy "teachers see school enrollments"
  on public.enrollments for select
  using (
    public.current_role() in ('owner', 'teacher')
    and exists (
      select 1
      from public.users
      where users.id = enrollments.user_id
        and users.school_id = public.current_school_id()
    )
  );
