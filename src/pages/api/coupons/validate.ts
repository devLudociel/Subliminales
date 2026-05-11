import type { APIRoute } from 'astro';
import { db } from '../../../lib/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, subtotal } = await request.json();
    if (!code) return json({ error: 'Código requerido' }, 400);

    const normalizedCode = String(code).trim().toUpperCase();
    const snap = await getDocs(
      query(collection(db, 'coupons'), where('code', '==', normalizedCode))
    );

    if (snap.empty) return json({ error: 'Cupón no válido' }, 404);

    const docSnap = snap.docs[0];
    const c = docSnap.data();

    if (!c.active) return json({ error: 'Cupón inactivo' }, 400);
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return json({ error: 'Cupón expirado' }, 400);
    if (c.maxUses && c.uses >= c.maxUses) return json({ error: 'Cupón agotado' }, 400);
    if (c.minOrder && (subtotal ?? 0) < c.minOrder) {
      return json({ error: `Pedido mínimo ${c.minOrder.toFixed(2)}€ para este cupón` }, 400);
    }

    const discount = c.type === 'percent'
      ? Math.round((subtotal ?? 0) * (c.value / 100) * 100) / 100
      : Math.min(c.value, subtotal ?? 0);

    return json({
      ok: true,
      couponId: docSnap.id,
      code: normalizedCode,
      type: c.type,
      value: c.value,
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
