import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { db } from '../../../lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string);

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = import.meta.env.STRIPE_WEBHOOK_SECRET as string;

  if (!sig || !webhookSecret) {
    return new Response('Webhook not configured', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const meta = session.metadata ?? {};
      const itemPairs = (meta.item_ids ?? '').split(',').filter(Boolean);
      const items = itemPairs.map(pair => {
        const [id, qty] = pair.split(':');
        return { productId: id, quantity: Number(qty) };
      });

      await addDoc(collection(db, 'orders'), {
        stripeSessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: (session.amount_total ?? 0) / 100,
        currency: session.currency,
        customer: {
          name: meta.customer_name ?? '',
          email: meta.customer_email ?? session.customer_email ?? '',
          address: meta.shipping_address ?? '',
          city: meta.shipping_city ?? '',
          province: meta.shipping_province ?? '',
          zip: meta.shipping_zip ?? '',
        },
        shippingMethod: meta.shipping_method ?? 'standard',
        taxNote: meta.tax_note ?? '',
        items,
        createdAt: serverTimestamp(),
      });

      console.log('Order saved:', session.id);
    } catch (err) {
      console.error('Error saving order to Firestore:', err);
      // Still return 200 so Stripe doesn't retry — log and investigate manually
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
