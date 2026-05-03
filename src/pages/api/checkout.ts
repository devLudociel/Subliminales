import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { db } from '../../lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import type { ProductVariant } from '../../data/products';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string);

const FREE_THRESHOLD_CENTS = 6000; // 60€ gross
const IVA_DIVISOR          = 1.21;  // prices stored with IVA 21% included

const SHIPPING_RATES = {
  standard: { display_name: 'Envío estándar 📦', amount: 699 },
  express:  { display_name: 'Envío urgente ⚡',  amount: 1499 },
};

interface OrderItem {
  id: string;
  quantity: number;
  variantId?: string;
  size?: string;
  color?: string;
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
      isCanarias,
      userUid,
    }: { items: OrderItem[]; customer: Customer; shippingMethod: string; isCanarias: boolean; userUid?: string } = body;

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

    // ── Fetch verified prices from Firestore ────────────────────
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    // Encode: "productId:variantId:size:color:qty" — variantId/size/color may be empty
    const itemMeta: string[] = [];

    for (const item of items) {
      if (!item.id || item.quantity < 1) continue;

      const snap = await getDoc(doc(db, 'products', item.id));
      if (!snap.exists()) {
        return json({ error: `Producto no encontrado: ${item.id}` }, 400);
      }

      const product = snap.data();
      const basePrice = Number(product.price);
      if (!basePrice || basePrice <= 0) {
        return json({ error: `Precio inválido para: ${product.name}` }, 400);
      }

      // Resolve variant price override
      let finalPrice = isCanarias ? basePrice / IVA_DIVISOR : basePrice;
      let resolvedVariantId = item.variantId ?? '';

      if (product.variants?.length) {
        const variants: ProductVariant[] = product.variants;

        // Find matching variant by ID first, then by size+color
        const variant =
          variants.find(v => v.id === item.variantId) ??
          variants.find(v =>
            (item.size  ? v.size  === item.size  : true) &&
            (item.color ? v.color === item.color : true)
          );

        if (variant) {
          if (variant.priceOverride && variant.priceOverride > 0) {
            const grossOverride = variant.priceOverride;
            finalPrice = isCanarias ? grossOverride / IVA_DIVISOR : grossOverride;
          }
          resolvedVariantId = variant.id;
        }
      }

      // Build human-readable variant suffix for Stripe line item name
      const variantParts = [item.size, item.color].filter(Boolean);
      const displayName = variantParts.length
        ? `${product.name} — ${variantParts.join(' / ')}`
        : String(product.name);

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: displayName,
            ...(product.image ? { images: [String(product.image)] } : {}),
            metadata: {
              productId: item.id,
              variantId: resolvedVariantId,
              size: item.size ?? '',
              color: item.color ?? '',
            },
          },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: Math.min(item.quantity, 99),
      });

      itemMeta.push(
        [item.id, resolvedVariantId, item.size ?? '', item.color ?? '', item.quantity].join(':')
      );
    }

    if (lineItems.length === 0) {
      return json({ error: 'No hay productos válidos en el carrito' }, 400);
    }

    // ── Shipping ────────────────────────────────────────────────
    const subtotalCents = lineItems.reduce(
      (s, li) => s + (li.price_data!.unit_amount! as number) * (li.quantity as number),
      0
    );
    const freeEligible = subtotalCents >= FREE_THRESHOLD_CENTS;

    let shippingOption: Stripe.Checkout.SessionCreateParams.ShippingOption;

    // Adjust shipping cost for Canarias (remove IVA)
    const stdCents = isCanarias
      ? Math.round(SHIPPING_RATES.standard.amount / IVA_DIVISOR)
      : SHIPPING_RATES.standard.amount;
    const expCents = isCanarias
      ? Math.round(SHIPPING_RATES.express.amount / IVA_DIVISOR)
      : SHIPPING_RATES.express.amount;

    if (shippingMethod === 'express') {
      shippingOption = {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: expCents, currency: 'eur' },
          display_name: SHIPPING_RATES.express.display_name,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 1 },
            maximum: { unit: 'business_day', value: 2 },
          },
        },
      };
    } else if (shippingMethod === 'free' && freeEligible) {
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
    } else {
      // standard — or free fallback if not eligible
      shippingOption = {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: freeEligible ? 0 : stdCents,
            currency: 'eur',
          },
          display_name: freeEligible ? 'Envío gratis 🎉' : SHIPPING_RATES.standard.display_name,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: 3 },
            maximum: { unit: 'business_day', value: 5 },
          },
        },
      };
    }

    const origin = request.headers.get('origin') || 'https://subliminal.es';
    const taxNote = isCanarias ? 'Exento IVA (Canarias)' : 'IVA 21% incluido';

    // ── Create Stripe Checkout Session ─────────────────────────
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      shipping_options: [shippingOption],
      customer_email: customer.email,
      metadata: {
        customer_name:     `${customer.firstName} ${customer.lastName}`.trim(),
        customer_email:    customer.email,
        shipping_address:  customer.address,
        shipping_city:     customer.city,
        shipping_province: customer.province,
        shipping_zip:      customer.zip,
        shipping_method:   shippingMethod,
        tax_note:          taxNote,
        user_uid:          userUid ?? '',
        // format: "productId:variantId:size:color:qty" comma-separated
        item_ids:          itemMeta.join(','),
      },
      locale: 'es',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/carrito`,
      expires_at:  Math.floor(Date.now() / 1000) + 30 * 60,
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
