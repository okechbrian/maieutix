# Maieutix Launch Readiness

This repo now runs as a single Next.js app for the current prototype. Route handlers under `apps/web/src/app/api` replace the old external `localhost:8000` dependency and use Supabase as the MVP persistence layer.

The product direction is aligned to `Maieutic_Video_Analysis_Replication_Guide.pdf`: spec-first programming education, Socratic AI approval, locked editor, autocomplete disabled, syntax-only coding help, and reflection through spec-vs-code gap analysis.

## Local Demo

- Student join code: `MAI-101`
- Teacher route: `/teacher`
- Legacy instructor route: `/instructor` with class `MAI-101` and password `instructor123`
- Admin AI audit route: `/admin`

## Production Environment

Copy `apps/web/.env.example` into Vercel project settings and provide real values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `MAIEUTIX_AI_MODEL`
- `NEXT_PUBLIC_APP_URL`

## Supabase

Apply `infra/supabase/migrations/0001_school_platform.sql` in a Supabase project. It creates the school, user, classroom, curriculum, session, dialogue, submission, reflection, and AI audit tables with starter row-level security policies.

For the local demo classroom, create an owner user in Supabase Auth, replace `owner_user_id` in `infra/supabase/seed-demo.sql`, and run that seed. It creates the demo school, classroom `MAI-101`, Python Beginner course records, and a default assignment.

## AI Coach

The coach uses a chat-completions-compatible API with `MAIEUTIX_AI_MODEL`, defaulting to `gpt-5-mini`. If `OPENAI_API_KEY` is missing or the API fails, the app returns a guided fallback question and records an AI event.

The coach must preserve the Maieutic role:

- Ask one focused clarifying question at a time.
- Never write code during specification.
- Approve only precise specs with input, output, and edge-case behavior.
- Emit `[SPEC_APPROVED]` when the editor may unlock.
- During coding, answer narrow syntax questions only.
- Refuse complete-solution and "fix my code" requests.

## Current Stabilization State

- Supabase is the primary store; no in-memory fallback is expected.
- Teacher signup and student join use Supabase Auth plus `public.users`.
- Local production builds use system fonts, not Google font fetches.

## Remaining Hardening

- Add generated Supabase database types instead of local row types.
- Replace local rule-based spec approval and gap analysis with structured LLM outputs.
- Add cohort reasoning analytics: vague specs, drift patterns, concept struggles, and exemplar reflections.
- Add Playwright E2E smoke tests for student lesson completion and teacher reporting.
