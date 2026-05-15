import type { APIRoute } from 'astro';
import { adminDb } from '../../lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { verifyUser } from '../../lib/auth';
import { rateLimit, clientIp, maybeGc } from '../../lib/rate-limit';
import { escapeHtml } from '../../lib/escape';

const resend = new Resend(import.meta.env.RESEND_API_KEY as string);
const ADMIN = 'rubenjruiz1441@gmail.com';

const REASONS: Record<string, string> = {
  'talla': 'Talla incorrecta',
  'defecto': 'Producto defectuoso',
  'no-corresponde': 'No corresponde a la descripción',
  'cambio-opinion': 'Cambio de opinión',
  'otro': 'Otro motivo',
};

export const POST: APIRoute = async ({ request }) => {
  try {
    maybeGc();
    const ip = clientIp(request);
    const rl = rateLimit(`returns:${ip}`, 5, 60_000);
    if (!rl.ok) return json({ error: 'Demasiadas peticiones' }, 429);

    const auth = await verifyUser(request);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const { orderId, reason, details } = await request.json();

    if (!orderId || !reason) return json({ error: 'Faltan datos requeridos' }, 400);
    if (typeof orderId !== 'string' || orderId.length > 200) return json({ error: 'orderId inválido' }, 400);
    if (typeof reason !== 'string' || !(reason in REASONS)) return json({ error: 'Motivo inválido' }, 400);

    const cleanDetails = String(details ?? '').slice(0, 2000);
    const reasonLabel = REASONS[reason];
    const userUid = auth.user.uid;
    const userEmail = (auth.user.email ?? '').toLowerCase();

    // Verify the order belongs to the authenticated user
    let orderEmail = '';
    const direct = await adminDb().collection('orders').doc(orderId).get();
    if (direct.exists) {
      orderEmail = String((direct.data()?.customer?.email ?? '') ).toLowerCase();
    } else {
      const q = await adminDb()
        .collection('orders')
        .where('stripeSessionId', '==', orderId)
        .limit(1)
        .get();
      if (q.empty) return json({ error: 'Pedido no encontrado' }, 404);
      orderEmail = String((q.docs[0].data()?.customer?.email ?? '')).toLowerCase();
    }
    if (orderEmail && orderEmail !== userEmail) {
      return json({ error: 'No autorizado para este pedido' }, 403);
    }

    await adminDb().collection('returns').add({
      orderId,
      reason,
      reasonLabel,
      details: cleanDetails,
      userUid,
      userEmail,
      status: 'pendiente',
      createdAt: FieldValue.serverTimestamp(),
    });

    const safeOrderId = escapeHtml(orderId);
    const shortOrder = orderId.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
    const safeShort = escapeHtml(shortOrder);
    const safeReason = escapeHtml(reasonLabel);
    const safeDetails = escapeHtml(cleanDetails || '—');
    const safeUserEmail = escapeHtml(userEmail || 'No autenticado');

    // Notify admin
    try {
      await resend.emails.send({
        from: 'Subliminal.es <onboarding@resend.dev>',
        to: ADMIN,
        subject: `↩️ Solicitud de devolución — #${shortOrder}`,
        html: `<!DOCTYPE html><html lang="es"><body style="font-family:sans-serif;padding:24px;">
          <h2 style="color:#f72585;">↩️ Nueva solicitud de devolución</h2>
          <p><strong>Pedido:</strong> #${safeShort} (${safeOrderId})</p>
          <p><strong>Usuario:</strong> ${safeUserEmail}</p>
          <p><strong>Motivo:</strong> ${safeReason}</p>
          <p><strong>Detalles:</strong> ${safeDetails}</p>
          <hr>
          <a href="https://subliminal.es/admin/pedidos" style="background:#111;color:#4cc9a0;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ver en panel admin →
          </a>
        </body></html>`,
      });
    } catch {}

    if (userEmail) {
      try {
        await resend.emails.send({
          from: 'Subliminal.es <onboarding@resend.dev>',
          to: userEmail,
          subject: '↩️ Hemos recibido tu solicitud de devolución — Subliminal.es',
          html: `<!DOCTYPE html><html lang="es"><body style="font-family:sans-serif;padding:24px;background:#fef0f4;">
            <table width="600" style="max-width:600px;margin:0 auto;background:#fff;border:2px solid #111;border-radius:12px;overflow:hidden;">
              <tr><td style="background:#f72585;padding:24px;"><h1 style="margin:0;color:#fff;font-size:24px;">SUBLIMINAL.ES</h1></td></tr>
              <tr><td style="padding:32px;">
                <h2 style="color:#111;">↩️ Solicitud recibida</h2>
                <p>Hemos recibido tu solicitud de devolución para el pedido <strong>#${safeShort}</strong>.</p>
                <p><strong>Motivo:</strong> ${safeReason}</p>
                <p>Te contactaremos en las próximas 24-48h con las instrucciones de envío.</p>
                <p style="color:#888;font-size:14px;">Si tienes dudas, responde a este email.</p>
              </td></tr>
              <tr><td style="background:#4cc9a0;padding:16px;text-align:center;border-top:2px solid #111;">
                <p style="margin:0;font-size:14px;">Ropa con chiste desde 2025 · subliminal.es</p>
              </td></tr>
            </table>
          </body></html>`,
        });
      } catch {}
    }

    return json({ ok: true });
  } catch (err) {
    console.error('Returns error:', err);
    return json({ error: 'Error al procesar la solicitud' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
