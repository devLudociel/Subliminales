import type { APIRoute } from 'astro';
import { adminDb } from '../../../lib/firebase/admin';
import { rateLimit, clientIp, maybeGc } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request }) => {
  try {
    maybeGc();
    const ip = clientIp(request);
    const rl = rateLimit(`coupon:${ip}`, 20, 60_000);
    if (!rl.ok) return json({ error: 'Demasiadas peticiones' }, 429);

    const { code, subtotal } = await request.json();
    if (!code || typeof code !== 'string') return json({ error: 'Código requerido' }, 400);
    if (code.length > 32) return json({ error: 'Código inválido' }, 400);

    const subtotalNum = Number(subtotal);
    const safeSubtotal = Number.isFinite(subtotalNum) && subtotalNum >= 0 ? subtotalNum : 0;

    const normalizedCode = String(code).trim().toUpperCase();
    const snap = await adminDb()
      .collection('coupons')
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();

    if (snap.empty) return json({ error: 'Cupón no válido' }, 404);

    const docSnap = snap.docs[0];
    const c = docSnap.data();

    if (!c.active) return json({ error: 'Cupón inactivo' }, 400);
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return json({ error: 'Cupón expirado' }, 400);
    if (c.maxUses && (c.uses ?? 0) >= c.maxUses) return json({ error: 'Cupón agotado' }, 400);
    if (c.minOrder && safeSubtotal < c.minOrder) {
      return json({ error: `Pedido mínimo ${Number(c.minOrder).toFixed(2)}€ para este cupón` }, 400);
    }

    const value = Number(c.value);
    if (!Number.isFinite(value) || value < 0) return json({ error: 'Cupón mal configurado' }, 500);

    const discount = c.type === 'percent'
      ? Math.round(safeSubtotal * (value / 100) * 100) / 100
      : Math.min(value, safeSubtotal);

    return json({
      ok: true,
      couponId: docSnap.id,
      code: normalizedCode,
      type: c.type,
      value,
      discount,
    });
  } catch (err) {
    console.error('Coupon validate error:', err);
    return json({ error: 'Error al validar cupón' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
