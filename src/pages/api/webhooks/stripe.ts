import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendOrderConfirmation, sendAdminNewOrder } from '../../../lib/emails';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string);

export const prerender = false;

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
      // ── Idempotency: skip if this session already produced an order ───
      const existing = await adminDb()
        .collection('orders')
        .where('stripeSessionId', '==', session.id)
        .limit(1)
        .get();
      if (!existing.empty) {
        console.log('Duplicate webhook ignored for session', session.id);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const meta = session.metadata ?? {};
      const itemPairs = (meta.item_ids ?? '').split(',').filter(Boolean);
      const items = itemPairs.map(pair => {
        const parts = pair.split(':');
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

      await adminDb().collection('orders').add({
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
        couponCode: meta.coupon_code || null,
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log('Order saved:', session.id);

      const emailOrder = {
        stripeSessionId: session.id,
        amountTotal: (session.amount_total ?? 0) / 100,
        shippingMethod: meta.shipping_method ?? 'standard',
        taxNote: meta.tax_note ?? '',
        customer: {
          name:     meta.customer_name ?? '',
          email:    (meta.customer_email ?? session.customer_email ?? '').toLowerCase(),
          address:  meta.shipping_address ?? '',
          city:     meta.shipping_city ?? '',
          province: meta.shipping_province ?? '',
          zip:      meta.shipping_zip ?? '',
        },
        items,
      };
      await Promise.allSettled([
        sendOrderConfirmation(emailOrder),
        sendAdminNewOrder(emailOrder),
      ]);

      // Decrement stock atomically using Admin SDK transactions
      for (const item of items) {
        if (!item.productId) continue;
        try {
          const productRef = adminDb().collection('products').doc(item.productId);
          await adminDb().runTransaction(async (tx) => {
            const snap = await tx.get(productRef);
            if (!snap.exists) return;
            const data = snap.data()!;

            if (data.variants?.length) {
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
              tx.update(productRef, { stock: Math.max(0, data.stock - item.quantity) });
            }
          });
        } catch (stockErr) {
          console.error(`Error decrementing stock for ${item.productId}:`, stockErr);
        }
      }

      // Increment coupon usage counter
      if (meta.coupon_code) {
        try {
          const code = meta.coupon_code.trim().toUpperCase();
          const couponSnap = await adminDb()
            .collection('coupons')
            .where('code', '==', code)
            .limit(1)
            .get();
          if (!couponSnap.empty) {
            await couponSnap.docs[0].ref.update({
              uses: FieldValue.increment(1),
              lastUsedAt: FieldValue.serverTimestamp(),
            });
          }
        } catch (couponErr) {
          console.error('Error incrementing coupon uses:', couponErr);
        }
      }
    } catch (err) {
      console.error('Error saving order to Firestore:', err);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
