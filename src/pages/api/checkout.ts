import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { db } from '../../lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string);

const FREE_THRESHOLD_CENTS = 6000; // 60€

const SHIPPING_RATES: Record<string, { display_name: string; amount: number; delivery_estimate: string }> = {
  standard: {
    display_name: 'Envío estándar 📦',
    amount: 699,
    delivery_estimate: '3-5 días laborables',
  },
  express: {
    display_name: 'Envío urgente ⚡',
    amount: 1499,
    delivery_estimate: '24/48h laborables',
  },
};

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
  province: string;
  zip: string;
}

function isCanarias(zip: string) {
  return /^(35|38)\d{3}$/.test(zip.trim());
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      items,
      customer,
      shippingMethod,
    }: { items: OrderItem[]; customer: Customer; shippingMethod: string } = body;

    // ── Validate input ──────────────────────────────────────────
    if (!items?.length) {
      return json({ error: 'El carrito está vacío' }, 400);
    }
    if (
      !customer?.email ||
      !customer?.firstName ||
      !customer?.address ||
      !customer?.city ||
      !customer?.province ||
      !customer?.zip
    ) {
      return json({ error: 'Datos de contacto incompletos' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return json({ error: 'Email inválido' }, 400);
    }
    if (!/^\d{4,5}$/.test(customer.zip.trim())) {
      return json({ error: 'Código postal inválido' }, 400);
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
          unit_amount: Math.round(priceEur * 100),
        },
        quantity: Math.min(item.quantity, 99),
      });
    }

    if (lineItems.length === 0) {
      return json({ error: 'No hay productos válidos en el carrito' }, 400);
    }

    // ── Determine shipping server-side ──────────────────────────
    const subtotalCents = lineItems.reduce(
      (s, li) => s + (li.price_data!.unit_amount! as number) * (li.quantity as number),
      0
    );
    const freeEligible = subtotalCents >= FREE_THRESHOLD_CENTS;

    let shippingOption: Stripe.Checkout.SessionCreateParams.ShippingOption;

    if (shippingMethod === 'free' && freeEligible) {
      shippingOption = {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: 0, currency: 'eur' },
          display_name: 'Envío gratis 🎉',
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 5 },
          },
        },
      };
    } else if (shippingMethod === 'express') {
      shippingOption = {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: SHIPPING_RATES.express.amount, currency: 'eur' },
          display_name: SHIPPING_RATES.express.display_name,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 1 },
            maximum: { unit: 'business_day', value: 2 },
          },
        },
      };
    } else {
      // standard (or free attempted but not eligible → fallback to standard)
      shippingOption = {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: freeEligible ? 0 : SHIPPING_RATES.standard.amount,
            currency: 'eur',
          },
          display_name: freeEligible
            ? 'Envío gratis 🎉'
            : SHIPPING_RATES.standard.display_name,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 5 },
          },
        },
      };
    }

    const origin = request.headers.get('origin') || 'https://subliminal.es';

    // ── Tax note (informational — prices already include IVA or are IGIC-exempt) ──
    const taxNote = isCanarias(customer.zip)
      ? 'Exento IGIC (Canarias)'
      : 'IVA 21% incluido';

    // ── Create Stripe Checkout Session ─────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      shipping_options: [shippingOption],
      customer_email: customer.email,
      metadata: {
        customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
        customer_email: customer.email,
        shipping_address: customer.address,
        shipping_city: customer.city,
        shipping_province: customer.province,
        shipping_zip: customer.zip,
        shipping_method: shippingMethod,
        tax_note: taxNote,
        item_ids: items.map(i => `${i.id}:${i.quantity}`).join(','),
      },
      locale: 'es',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrito`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
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
