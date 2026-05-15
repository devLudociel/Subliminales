import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { adminDb } from '../../lib/firebase/admin';
import { rateLimit, clientIp, maybeGc } from '../../lib/rate-limit';
import type { ProductVariant } from '../../data/products';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string);

const FREE_THRESHOLD_CENTS = 6000; // 60€ gross
const IVA_DIVISOR          = 1.21;  // prices stored with IVA 21% included
const SITE_URL = (import.meta.env.PUBLIC_SITE_URL as string) || 'https://subliminal.es';

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

export const POST: APIRoute = async ({ request }) => {
  try {
    maybeGc();
    const ip = clientIp(request);
    const rl = rateLimit(`checkout:${ip}`, 10, 60_000);
    if (!rl.ok) return json({ error: 'Demasiadas peticiones' }, 429);

    const body = await request.json();
    const {
      items,
      customer,
      shippingMethod,
      isCanarias,
      userUid,
      couponCode,
      couponDiscount,
    }: { items: OrderItem[]; customer: Customer; shippingMethod: string; isCanarias: boolean; userUid?: string; couponCode?: string; couponDiscount?: number } = body;

    // ── Validate input ──────────────────────────────────────────
    if (!Array.isArray(items) || !items.length) {
      return json({ error: 'El carrito está vacío' }, 400);
    }
    if (items.length > 50) {
      return json({ error: 'Demasiados productos' }, 400);
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
    if (!/^\d{4,5}$/.test(String(customer.zip).trim())) {
      return json({ error: 'Código postal inválido' }, 400);
    }
    // Length caps to bound metadata size (Stripe limits 500 chars per value)
    const cap = (s: string, n: number) => String(s ?? '').slice(0, n);
    customer.email     = cap(customer.email, 254);
    customer.firstName = cap(customer.firstName, 80);
    customer.lastName  = cap(customer.lastName, 80);
    customer.address   = cap(customer.address, 200);
    customer.city      = cap(customer.city, 80);
    customer.province  = cap(customer.province, 80);
    customer.zip       = cap(customer.zip, 10);

    // ── Fetch verified prices from Firestore (Admin SDK) ─────────
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const itemMeta: string[] = [];

    for (const item of items) {
      if (!item?.id || typeof item.id !== 'string' || item.id.length > 64) continue;
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) continue;

      const snap = await adminDb().collection('products').doc(item.id).get();
      if (!snap.exists) {
        return json({ error: `Producto no encontrado: ${item.id}` }, 400);
      }

      const product = snap.data()!;
      const basePrice = Number(product.price);
      if (!basePrice || basePrice <= 0) {
        return json({ error: `Precio inválido para: ${product.name}` }, 400);
      }

      let finalPrice = isCanarias ? basePrice / IVA_DIVISOR : basePrice;
      let resolvedVariantId = item.variantId ?? '';

      if (product.variants?.length) {
        const variants: ProductVariant[] = product.variants;

        const variant =
          variants.find(v => v.id === item.variantId) ??
          variants.find(v =>
            (item.size  ? v.size  === item.size  : true) &&
            (item.color ? v.color === item.color : true)
          );

        if (variant) {
          if (variant.stock < qty) {
            const available = variant.stock;
            const varLabel = [item.size, item.color].filter(Boolean).join(' / ');
            if (available <= 0) {
              return json({ error: `"${product.name}${varLabel ? ' — ' + varLabel : ''}" está agotado.` }, 400);
            }
            return json({ error: `Solo quedan ${available} unidades de "${product.name}${varLabel ? ' — ' + varLabel : ''}".` }, 400);
          }
          if (variant.priceOverride && variant.priceOverride > 0) {
            const grossOverride = variant.priceOverride;
            finalPrice = isCanarias ? grossOverride / IVA_DIVISOR : grossOverride;
          }
          resolvedVariantId = variant.id;
        } else {
          return json({ error: `Variante no encontrada para: ${product.name}` }, 400);
        }
      } else if (typeof product.stock === 'number' && product.stock < qty) {
        if (product.stock <= 0) {
          return json({ error: `"${product.name}" está agotado.` }, 400);
        }
        return json({ error: `Solo quedan ${product.stock} unidades de "${product.name}".` }, 400);
      }

      const variantParts = [item.size, item.color].filter(Boolean);
      const displayName = variantParts.length
        ? `${product.name} — ${variantParts.join(' / ')}`
        : String(product.name);

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: displayName,
            ...(product.image && /^https?:\/\//.test(String(product.image)) ? { images: [String(product.image)] } : {}),
            metadata: {
              productId: item.id,
              variantId: resolvedVariantId,
              size: cap(item.size ?? '', 40),
              color: cap(item.color ?? '', 40),
            },
          },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: qty,
      });

      itemMeta.push(
        [item.id, resolvedVariantId, cap(item.size ?? '', 40), cap(item.color ?? '', 40), qty].join(':')
      );
    }

    if (lineItems.length === 0) {
      return json({ error: 'No hay productos válidos en el carrito' }, 400);
    }

    // ── Coupon: re-validate server-side, never trust client discount ─────
    let appliedCoupon: { code: string; discountCents: number } | null = null;
    if (couponCode && typeof couponCode === 'string') {
      const code = couponCode.trim().toUpperCase().slice(0, 32);
      const subtotalCents = lineItems.reduce(
        (s, li) => s + (li.price_data!.unit_amount! as number) * (li.quantity as number),
        0
      );
      const couponSnap = await adminDb()
        .collection('coupons')
        .where('code', '==', code)
        .limit(1)
        .get();
      if (!couponSnap.empty) {
        const c = couponSnap.docs[0].data();
        const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
        const exhausted = c.maxUses && (c.uses ?? 0) >= c.maxUses;
        const subtotalEur = subtotalCents / 100;
        const meetsMin = !c.minOrder || subtotalEur >= c.minOrder;
        if (c.active && !expired && !exhausted && meetsMin) {
          const value = Number(c.value);
          const discountEur = c.type === 'percent'
            ? Math.round(subtotalEur * (value / 100) * 100) / 100
            : Math.min(value, subtotalEur);
          const discountCents = Math.round(discountEur * 100);
          if (discountCents > 0) {
            appliedCoupon = { code, discountCents };
            lineItems.push({
              price_data: {
                currency: 'eur',
                product_data: { name: `Descuento (${code})` },
                unit_amount: -discountCents,
              },
              quantity: 1,
            });
          }
        }
      }
    }

    // ── Shipping ────────────────────────────────────────────────
    const subtotalCents = lineItems.reduce(
      (s, li) => s + (li.price_data!.unit_amount! as number) * (li.quantity as number),
      0
    );
    const freeEligible = subtotalCents >= FREE_THRESHOLD_CENTS;

    let shippingOption: Stripe.Checkout.SessionCreateParams.ShippingOption;

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

    // Use server-side fixed origin to prevent open-redirect via spoofed Origin header
    const taxNote = isCanarias ? 'Exento IVA (Canarias)' : 'IVA 21% incluido';

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
        shipping_method:   String(shippingMethod ?? '').slice(0, 20),
        tax_note:          taxNote,
        user_uid:          cap(userUid ?? '', 64),
        coupon_code:       appliedCoupon?.code ?? '',
        coupon_discount:   appliedCoupon ? (appliedCoupon.discountCents / 100).toFixed(2) : '',
        item_ids:          itemMeta.join(',').slice(0, 500),
      },
      locale: 'es',
      success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE_URL}/carrito`,
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
