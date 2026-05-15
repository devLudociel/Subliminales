import type { APIRoute } from 'astro';
import { adminDb } from '../../lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyUser } from '../../lib/auth';
import { rateLimit, clientIp, maybeGc } from '../../lib/rate-limit';

export const GET: APIRoute = async ({ url }) => {
  const productId = url.searchParams.get('productId');
  if (!productId) return json({ error: 'productId requerido' }, 400);
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(productId)) return json({ error: 'productId inválido' }, 400);

  const snap = await adminDb()
    .collection('reviews')
    .where('productId', '==', productId)
    .where('approved', '==', true)
    .get();

  const reviews = snap.docs.map(d => {
    const data = d.data();
    // Strip internal fields before sending to client
    return {
      id: d.id,
      productId: data.productId,
      rating: data.rating,
      body: data.body,
      authorName: data.authorName,
      createdAt: data.createdAt,
    };
  });
  return json({ reviews });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    maybeGc();
    const ip = clientIp(request);
    const rl = rateLimit(`reviews:${ip}`, 5, 60_000);
    if (!rl.ok) return json({ error: 'Demasiadas peticiones' }, 429);

    // Require authenticated user — prevent fake reviews / userUid spoofing
    const auth = await verifyUser(request);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const { productId, rating, body, authorName } = await request.json();

    if (!productId || !rating || !body?.trim() || !authorName?.trim()) {
      return json({ error: 'Faltan campos requeridos' }, 400);
    }
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(String(productId))) {
      return json({ error: 'productId inválido' }, 400);
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return json({ error: 'Rating entre 1 y 5' }, 400);
    }
    const cleanBody = String(body).trim().slice(0, 2000);
    const cleanAuthor = String(authorName).trim().slice(0, 80);

    const userUid = auth.user.uid;

    // Verify product exists
    const productSnap = await adminDb().collection('products').doc(String(productId)).get();
    if (!productSnap.exists) return json({ error: 'Producto no encontrado' }, 404);

    // One review per user per product
    const existing = await adminDb()
      .collection('reviews')
      .where('productId', '==', productId)
      .where('userUid', '==', userUid)
      .limit(1)
      .get();
    if (!existing.empty) return json({ error: 'Ya has valorado este producto' }, 409);

    await adminDb().collection('reviews').add({
      productId,
      rating: ratingNum,
      body: cleanBody,
      authorName: cleanAuthor,
      userUid,
      userEmail: (auth.user.email ?? '').toLowerCase(),
      approved: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    return json({ ok: true });
  } catch (err) {
    console.error('Reviews error:', err);
    return json({ error: 'Error al guardar reseña' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
