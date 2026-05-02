# Maieutic PDF Alignment

Source reviewed: `C:\Users\y\Downloads\Documents\Maieutic_Video_Analysis_Replication_Guide.pdf`.

## Core Product Definition

The PDF defines Maieutic as a narrow pedagogical tool, not a general coding assistant:

- Students must write a natural-language specification before coding.
- The AI acts as a Socratic spec coach and asks clarifying questions.
- The editor unlocks only after the spec is approved.
- Autocomplete and AI code completion are disabled.
- During coding, the AI only answers narrow syntax questions and refuses full solutions.
- Submission triggers spec-vs-code gap analysis and targeted reflection prompts.
- Teachers see reasoning signals at class scale: vague specs, drift patterns, concept struggles, and strong reflection examples.

## Current Implementation Match

Implemented:

- Next.js App Router, TypeScript, Tailwind, Monaco editor.
- Student join by class code.
- Spec-first session page.
- Locked editor before approval.
- Monaco autocomplete/intellisense disabled.
- Backend route rejects code submission before spec approval.
- AI coach prompt follows the PDF persona and uses `[SPEC_APPROVED]`.
- Fallback spec-quality evaluator when no AI key is present.
- Browser-side Python execution through Pyodide.
- Reflection score and simple gap analysis.
- Teacher class dashboard with phase filtering and CSV export.
- Supabase production schema/RLS migration for school/class/session data.

Partially implemented:

- Gap analysis is rule-based locally; production should use the LLM prompt described in the PDF.
- Teacher dashboard shows phase/spec/score, but not yet a cohort heatmap or anonymous high-quality reflection examples.
- Live updates use polling, not WebSockets.
- Prompt/token cost tracking stores audit events, but not token totals or per-student budgets.
- Spec approval is route-enforced, but teacher override and assignment-intent matching still need production design.

Not yet implemented:

- Real Supabase Auth and database-backed persistence.
- Streaming coach responses.
- LLM-generated concept struggle tags.
- Exportable PDF session reports.
- Hidden tests or sandboxed server execution. Pyodide covers v1 browser execution.
- WebSocket live classroom feed.
- Full ethical framing UI: pseudonyms, transparent data-use notice, and teacher data ownership controls.

## Build Priority From Here

1. Replace the in-memory store with Supabase while preserving current API contracts.
2. Move spec approval and gap analysis fully into LLM-backed evaluators with strict JSON outputs.
3. Add teacher reasoning analytics: vague spec flags, drift categories, concept struggle counts, and exemplar reflections.
4. Add WebSocket or Supabase Realtime updates for active classrooms.
5. Add transparent student privacy copy and pseudonym-first onboarding.
6. Add cost guardrails: per-session coach message budgets, model tiers, token totals, and admin alerts.

## Product Constraint

Avoid building features that turn Maieutix into a code-generation tutor. The PDF’s central value is preserving student cognitive work:

- Spec before implementation.
- AI as questioner, not answer engine.
- Code written from the student’s own intent.
- Reflection on the gap between intent and behavior.
