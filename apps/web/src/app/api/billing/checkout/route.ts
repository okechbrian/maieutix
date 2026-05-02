import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: userRecord } = await supabase.from('users').select('school_id').eq('id', userData.user.id).single();
  if (!userRecord) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 });
  }

  const { data: billing } = await supabase.from('billing_accounts').select('*').eq('school_id', userRecord.school_id).single();

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Maieutix Teacher Plan',
              description: 'Unlimited students and classes for one teacher.',
            },
            unit_amount: 1500, // $15.00/month
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/teacher?checkout=success`,
      cancel_url: `${origin}/teacher?checkout=cancelled`,
      client_reference_id: userRecord.school_id,
      customer: billing?.stripe_customer_id || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
