import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { db } from '../../../lib/firebase/client';
import { collection, addDoc, serverTimestamp, doc, runTransaction } from 'firebase/firestore';

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
      // format: "productId:variantId:size:color:qty"
      const itemPairs = (meta.item_ids ?? '').split(',').filter(Boolean);
      const items = itemPairs.map(pair => {
        const parts = pair.split(':');
        // support old format "productId:qty" and new "productId:variantId:size:color:qty"
        if (parts.length <= 2) {
          return { productId: parts[0], quantity: Number(parts[1] ?? 1) };
        }
        const [productId, variantId, size, color, qty] = parts;
        return {
          productId,
          variantId: variantId || undefined,
          size: size || undefined,
          color: color || undefined,
          quantity: Number(qty),
        };
      });

      await addDoc(collection(db, 'orders'), {
        stripeSessionId: session.id,
        paymentStatus: session.payment_status,
        amountTotal: (session.amount_total ?? 0) / 100,
        currency: session.currency,
        customer: {
          name: meta.customer_name ?? '',
          email: (meta.customer_email ?? session.customer_email ?? '').toLowerCase(),
          address: meta.shipping_address ?? '',
          city: meta.shipping_city ?? '',
          province: meta.shipping_province ?? '',
          zip: meta.shipping_zip ?? '',
        },
        shippingMethod: meta.shipping_method ?? 'standard',
        taxNote: meta.tax_note ?? '',
        userUid: meta.user_uid || null,
        customerEmail: (meta.customer_email ?? session.customer_email ?? '').toLowerCase(),
        items,
        createdAt: serverTimestamp(),
      });

      console.log('Order saved:', session.id);

      // Decrement stock for each item using transactions
      for (const item of items) {
        if (!item.productId) continue;
        try {
          const productRef = doc(db, 'products', item.productId);
          await runTransaction(db, async (tx) => {
            const snap = await tx.get(productRef);
            if (!snap.exists()) return;
            const data = snap.data();

            if (data.variants?.length) {
              // Find matching variant and decrement its stock
              const variants = [...data.variants];
              const idx = variants.findIndex((v: any) =>
                item.variantId
                  ? v.id === item.variantId
                  : (item.size  ? v.size  === item.size  : true) &&
                    (item.color ? v.color === item.color : true)
              );
              if (idx !== -1) {
                variants[idx] = {
                  ...variants[idx],
                  stock: Math.max(0, (variants[idx].stock ?? 0) - item.quantity),
                };
                tx.update(productRef, { variants });
              }
            } else if (typeof data.stock === 'number') {
              // Product without variants
              tx.update(productRef, { stock: Math.max(0, data.stock - item.quantity) });
            }
          });
        } catch (stockErr) {
          console.error(`Error decrementing stock for ${item.productId}:`, stockErr);
          // Non-fatal — order is saved, log for manual review
        }
      }
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
