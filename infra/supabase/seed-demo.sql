-- Maieutix demo seed for a Supabase-backed MVP.
--
-- Before running:
-- 1. Apply migrations/0001_school_platform.sql.
-- 2. Create a teacher/owner user in Supabase Auth.
-- 3. Replace the owner_user_id value below with that auth.users.id.
--
-- The script is idempotent for the fixed demo school/classroom/course IDs.

do $$
declare
  owner_user_id uuid := '00000000-0000-0000-0000-000000000000';
  demo_school_id uuid := '11111111-1111-1111-1111-111111111111';
  demo_classroom_id uuid := '22222222-2222-2222-2222-222222222222';
  demo_assignment_id uuid := '33333333-3333-3333-3333-333333333333';
  owner_email text;
begin
  if owner_user_id = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Replace owner_user_id with an existing Supabase Auth user id before running seed-demo.sql';
  end if;

  select email into owner_email from auth.users where id = owner_user_id;
  if owner_email is null then
    raise exception 'No auth.users row found for owner_user_id %', owner_user_id;
  end if;

  insert into public.schools (id, name, country, pilot_ends_at)
  values (demo_school_id, 'Maieutix Demo School', 'UG', now() + interval '3 months')
  on conflict (id) do update
    set name = excluded.name,
        country = excluded.country,
        pilot_ends_at = excluded.pilot_ends_at;

  insert into public.users (id, school_id, role, full_name, email)
  values (owner_user_id, demo_school_id, 'owner', 'Demo Teacher', owner_email)
  on conflict (id) do update
    set school_id = excluded.school_id,
        role = excluded.role,
        full_name = excluded.full_name,
        email = excluded.email;

  insert into public.courses (id, title, description)
  values (
    'python-beginner',
    'Python Beginner Track',
    'A school-ready first Python course built around specification, dialogue, code, and reflection.'
  )
  on conflict (id) do update
    set title = excluded.title,
        description = excluded.description;

  insert into public.lessons (
    id,
    course_id,
    slug,
    title,
    prompt,
    expected_concepts,
    starter_code,
    visible_tests,
    reflection_prompts,
    teacher_notes
  )
  values
    (
      'lesson-variables',
      'python-beginner',
      'variables',
      'Variables and Values',
      'Build a short learner profile that stores a name, age, school, and one learning goal, then prints a friendly summary.',
      array['variables', 'strings', 'numbers', 'print'],
      'name = "Amina"
age = 13
school = "Demo School"
goal = "learn Python"

# Print a profile summary below
',
      '["Output includes the learner name", "Output includes one number", "Code uses at least three variables"]'::jsonb,
      '["Which variable was easiest to explain?", "How would you rename one variable to make the program clearer?"]'::jsonb,
      'Look for meaningful variable names and evidence that students understand assignment versus printing.'
    ),
    (
      'lesson-conditionals',
      'python-beginner',
      'conditionals',
      'Conditionals',
      'Write a small study helper that recommends what a learner should do based on their quiz score.',
      array['if', 'elif', 'else', 'comparison'],
      'score = 72

# Recommend next steps for the learner
',
      '["Uses if or elif", "Handles high, medium, and low scores", "Prints a recommendation"]'::jsonb,
      '["What score ranges did you choose?", "What happens exactly at the boundary between two ranges?"]'::jsonb,
      'Ask students to justify their thresholds before they code.'
    ),
    (
      'lesson-loops',
      'python-beginner',
      'loops',
      'Loops',
      'Create a weekly practice planner that prints a small Python practice task for each school day.',
      array['for loop', 'list', 'print'],
      'days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

# Print a practice plan for each day
',
      '["Uses a loop", "Prints at least five lines", "Mentions each day"]'::jsonb,
      '["What repeated pattern did the loop remove?", "How would you add Saturday practice?"]'::jsonb,
      'Help learners see loops as a way to represent a pattern, not just a syntax requirement.'
    ),
    (
      'lesson-functions',
      'python-beginner',
      'functions',
      'Functions',
      'Write a function that creates a revision message for any subject and number of minutes.',
      array['def', 'parameters', 'return', 'function call'],
      'def revision_message(subject, minutes):
    # Return a helpful message
    return ""

print(revision_message("math", 20))
',
      '["Defines a function", "Uses at least two parameters", "Calls the function"]'::jsonb,
      '["Why is this better as a function?", "What input would you test next?"]'::jsonb,
      'A good answer separates the message pattern from one specific example.'
    ),
    (
      'lesson-lists',
      'python-beginner',
      'lists',
      'Lists',
      'Track a learner''s three recent quiz scores, calculate the total, and print a short progress message.',
      array['list', 'sum', 'len', 'loop or indexing'],
      'scores = [68, 74, 81]

# Calculate total and average
',
      '["Uses a list", "Calculates an average", "Prints a progress message"]'::jsonb,
      '["What changes if there are five scores?", "Why is a list better than three separate variables here?"]'::jsonb,
      'Encourage students to use len(scores), not a hard-coded count.'
    )
  on conflict (id) do update
    set course_id = excluded.course_id,
        slug = excluded.slug,
        title = excluded.title,
        prompt = excluded.prompt,
        expected_concepts = excluded.expected_concepts,
        starter_code = excluded.starter_code,
        visible_tests = excluded.visible_tests,
        reflection_prompts = excluded.reflection_prompts,
        teacher_notes = excluded.teacher_notes;

  insert into public.classrooms (id, school_id, teacher_id, name, join_code)
  values (demo_classroom_id, demo_school_id, owner_user_id, 'Python Pilot Class', 'MAI-101')
  on conflict (id) do update
    set school_id = excluded.school_id,
        teacher_id = excluded.teacher_id,
        name = excluded.name,
        join_code = excluded.join_code;

  insert into public.assignments (id, classroom_id, lesson_id, title)
  values (demo_assignment_id, demo_classroom_id, 'lesson-variables', 'Variables and Values')
  on conflict (id) do update
    set classroom_id = excluded.classroom_id,
        lesson_id = excluded.lesson_id,
        title = excluded.title;

end $$;
