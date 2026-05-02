Maieutix is a school coding platform prototype built as a single Next.js app. The current implementation includes local route handlers for class join, lesson sessions, Socratic coaching, teacher dashboards, and reporting while the Supabase production database is being connected.

## Getting Started

First, install dependencies and run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Demo paths:

- `/` student join. Use class code `MAI-101`.
- `/teacher` teacher dashboard.
- `/instructor` legacy instructor entry. Use class `MAI-101` and password `instructor123`.
- `/admin` AI audit events.

Core Maieutic behavior:

- Students write a specification first.
- The editor unlocks only after the coach approves the spec.
- Monaco autocomplete and inline suggestions are disabled.
- The API rejects code submission before approval.
- Submission compares spec intent against code behavior and prompts reflection.

Environment:

- Copy `.env.example` into Vercel project settings or a local `.env.local`.
- `MAIEUTIX_AI_MODEL` defaults to `gpt-5-mini`.
- Without `OPENAI_API_KEY`, the coach uses a safe fallback prompt so classrooms are not blocked during local demos.

Production database:

- Apply `../../infra/supabase/migrations/0001_school_platform.sql` in Supabase.
- Replace the in-memory store in `src/lib/store.ts` with Supabase queries behind the same route contracts.

## Learn More

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
