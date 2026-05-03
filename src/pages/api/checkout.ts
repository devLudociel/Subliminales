import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { db } from '../../lib/firebase/client';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string);

interface OrderItem {
  id: string;
  quantity: number;
}

interface Customer {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  zip: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { items, customer }: { items: OrderItem[]; customer: Customer } = body;

    // ── Validate input ──────────────────────────────────────────
    if (!items?.length) {
      return json({ error: 'El carrito está vacío' }, 400);
    }
    if (!customer?.email || !customer?.firstName || !customer?.address) {
      return json({ error: 'Datos de contacto incompletos' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return json({ error: 'Email inválido' }, 400);
    }

    // ── Fetch verified prices from Firestore (NEVER trust client prices) ──
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      if (!item.id || item.quantity < 1) continue;

      const snap = await getDoc(doc(db, 'products', item.id));
      if (!snap.exists()) {
        return json({ error: `Producto no encontrado: ${item.id}` }, 400);
      }

      const product = snap.data();
      const priceEur = Number(product.price);
      if (!priceEur || priceEur <= 0) {
        return json({ error: `Precio inválido para: ${product.name}` }, 400);
      }

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: String(product.name),
            ...(product.image ? { images: [String(product.image)] } : {}),
            metadata: { productId: item.id },
          },
          unit_amount: Math.round(priceEur * 100), // cents, IVA included
        },
        quantity: Math.min(item.quantity, 99), // cap at 99
      });
    }

    if (lineItems.length === 0) {
      return json({ error: 'No hay productos válidos en el carrito' }, 400);
    }

    // ── Determine shipping ──────────────────────────────────────
    const subtotalCents = lineItems.reduce(
      (s, li) => s + (li.price_data!.unit_amount! as number) * (li.quantity as number),
      0
    );
    const freeShipping = subtotalCents >= 5000; // 50€

    const origin = request.headers.get('origin') || 'https://subliminal.es';

    // ── Create Stripe Checkout Session ─────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      ...(freeShipping
        ? {}
        : {
            shipping_options: [
              {
                shipping_rate_data: {
                  type: 'fixed_amount',
                  fixed_amount: { amount: 495, currency: 'eur' },
                  display_name: 'Envío estándar 24/48h',
                },
              },
            ],
          }),
      customer_email: customer.email,
      metadata: {
        customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
        customer_email: customer.email,
        shipping_address: customer.address,
        shipping_city: customer.city,
        shipping_zip: customer.zip,
        item_ids: items.map(i => `${i.id}:${i.quantity}`).join(','),
      },
      locale: 'es',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrito`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
    });

    return json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return json({ error: 'Error al crear la sesión de pago' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
