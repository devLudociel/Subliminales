import type { APIRoute } from 'astro';
import { db } from '../../lib/firebase/client';
import {
  collection, addDoc, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';

export const GET: APIRoute = async ({ url }) => {
  const productId = url.searchParams.get('productId');
  if (!productId) return json({ error: 'productId requerido' }, 400);

  const snap = await getDocs(
    query(collection(db, 'reviews'), where('productId', '==', productId))
  );
  const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return json({ reviews });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { productId, rating, body, authorName, userUid } = await request.json();

    if (!productId || !rating || !body?.trim() || !authorName?.trim()) {
      return json({ error: 'Faltan campos requeridos' }, 400);
    }
    if (rating < 1 || rating > 5) return json({ error: 'Rating entre 1 y 5' }, 400);

    // One review per user per product
    if (userUid) {
      const existing = await getDocs(
        query(collection(db, 'reviews'),
          where('productId', '==', productId),
          where('userUid', '==', userUid))
      );
      if (!existing.empty) return json({ error: 'Ya has valorado este producto' }, 409);
    }

    await addDoc(collection(db, 'reviews'), {
      productId,
      rating: Number(rating),
      body: body.trim(),
      authorName: authorName.trim(),
      userUid: userUid ?? null,
      approved: true,
      createdAt: serverTimestamp(),
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
