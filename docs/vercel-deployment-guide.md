# Vercel Deployment & Environment Variables Guide

To finalize the deployment of Maieutix to Vercel, you need to configure the production environment variables. This ensures the app can securely connect to Supabase and the AI provider.

## 1. Required Environment Variables

You must add the following keys to your Vercel Project Settings:

- `NEXT_PUBLIC_SUPABASE_URL`: The URL of your production Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous public key for Supabase (safe for browser).
- `SUPABASE_SERVICE_ROLE_KEY`: The secret admin key for Supabase (bypasses RLS, never expose to browser).
- `OPENAI_API_KEY`: Your OpenAI-compatible API key for the LLM coaching and evaluators.
- `OPENAI_BASE_URL`: Optional. Set only when using a chat-completions-compatible non-default endpoint.
- `MAIEUTIX_AI_MODEL`: Set to `gpt-5-mini` (or your preferred model).
- `NEXT_PUBLIC_APP_URL`: The final deployed URL of your Vercel app (e.g., `https://maieutix.vercel.app`).

## 2. Where to Find Your Keys

### Supabase
1. Go to your Supabase Project Dashboard.
2. Click the **Settings** (gear) icon in the sidebar, then select **API**.
3. Copy the **Project URL**, **anon public key**, and **service_role secret key**.
4. Apply `infra/supabase/migrations/0001_school_platform.sql`.
5. Create a teacher/owner Auth user.
6. For the demo classroom, replace `owner_user_id` in `infra/supabase/seed-demo.sql` with that Auth user id and run the seed.

### OpenAI
1. Go to the [OpenAI Developer Platform](https://platform.openai.com/api-keys).
2. Generate a new secret key for the Maieutix production environment.

## 3. Configuring Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard) and select your Maieutix project.
2. Navigate to the **Settings** tab.
3. Click on **Environment Variables** in the left sidebar.
4. For each variable listed above:
   - Enter the **Key** (e.g., `OPENAI_API_KEY`).
   - Enter the **Value**.
   - Select the Environments to apply it to (usually **Production**, but you can check Preview/Development as well).
   - Click **Save**.

## 4. Triggering a Production Deploy

Once all variables are saved:
1. Go to the **Deployments** tab in your Vercel project.
2. Find the most recent deployment.
3. Click the three dots (`...`) on the right side of the deployment and select **Redeploy**.
4. Check the box to "Use existing Build Cache" if available, or just proceed. Vercel will rebuild the app using the new environment variables.

Your platform will be fully live and securely connected once the deployment succeeds!
