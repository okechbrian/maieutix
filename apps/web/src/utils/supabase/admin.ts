import { createClient } from '@supabase/supabase-js'

// Note: This client uses the service role key and bypasses RLS.
// It should ONLY be used in secure server contexts (e.g. Server Actions or API routes)
// where you need administrative privileges, such as creating initial users or schools.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
