import { NextResponse } from 'next/server';
import { stripe } from '@/utils/stripe';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (!sig || !webhookSecret) throw new Error('Missing stripe signature or secret');
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const adminClient = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const schoolId = session.client_reference_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    if (schoolId) {
      await adminClient.from('billing_accounts').update({
        plan: 'teacher',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      }).eq('school_id', schoolId);
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as any;
    await adminClient.from('billing_accounts').update({
      plan: 'free_pilot',
      stripe_subscription_id: null,
    }).eq('stripe_subscription_id', subscription.id);
  }

  return NextResponse.json({ received: true });
}
