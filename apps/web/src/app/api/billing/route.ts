import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: userRecord } = await supabase.from('users').select('school_id').eq('id', userData.user.id).single();
  if (!userRecord) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { data: billing } = await supabase.from('billing_accounts').select('*').eq('school_id', userRecord.school_id).single();
  
  return NextResponse.json(billing || { plan: 'free_pilot' });
}
