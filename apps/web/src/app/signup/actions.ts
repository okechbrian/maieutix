"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function signupTeacher(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const schoolName = formData.get("schoolName") as string;
  const country = formData.get("country") as "UG" | "KE";

  if (!email || !password || !fullName || !schoolName || !country) {
    return { error: "All fields are required" };
  }

  const supabase = await createClient();

  // 1. Sign up the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Failed to sign up" };
  }

  const userId = authData.user.id;

  // 2. We need admin privileges to create the school and the user record, 
  // because RLS restricts standard users from doing this until their school is set up.
  const adminClient = createAdminClient();

  try {
    // 3. Create the School
    // Give a 3 month pilot by default
    const pilotEndsAt = new Date();
    pilotEndsAt.setMonth(pilotEndsAt.getMonth() + 3);

    const { data: schoolData, error: schoolError } = await adminClient
      .from("schools")
      .insert({
        name: schoolName,
        country: country,
        pilot_ends_at: pilotEndsAt.toISOString(),
      })
      .select()
      .single();

    if (schoolError) throw new Error(schoolError.message);

    // 4. Create the public.user record
    const { error: userError } = await adminClient
      .from("users")
      .insert({
        id: userId,
        school_id: schoolData.id,
        role: "owner",
        full_name: fullName,
        email: email,
      });

    if (userError) throw new Error(userError.message);

    // 5. Create default billing account
    const { error: billingError } = await adminClient
      .from("billing_accounts")
      .insert({
        school_id: schoolData.id,
        plan: "free_pilot",
      });
      
    if (billingError) console.error("Billing error (non-fatal):", billingError);

    revalidatePath("/", "layout");
    return { success: true };
    
  } catch (error: any) {
    // If we failed after auth creation, it leaves an orphaned auth user, but for demo we throw
    return { error: error.message || "Failed to initialize school profile" };
  }
}
