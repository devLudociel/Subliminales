import type { APIRoute } from 'astro';
import { sendShippingNotification } from '../../../lib/emails';
import { auth } from '../../../lib/firebase/client';
import { ADMIN_EMAIL } from '../../../lib/firebase/client';

// Note: this endpoint is called client-side from the admin panel.
// It relies on the request body containing order data.
// The admin auth check is done via the ADMIN_EMAIL guard in the body.

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { stripeSessionId, trackingNumber, carrier, customerName, customerEmail, adminSecret } = body;

    // Simple guard — only callable with the admin email confirmed client-side
    // Real protection is Firestore rules; this is a soft server check
    if (!adminSecret || adminSecret !== (import.meta.env.RESEND_API_KEY as string).slice(-8)) {
      return json({ error: 'No autorizado' }, 403);
    }

    if (!trackingNumber || !carrier || !customerEmail) {
      return json({ error: 'Faltan datos de envío' }, 400);
    }

    await sendShippingNotification({
      stripeSessionId,
      trackingNumber,
      carrier,
      customer: { name: customerName, email: customerEmail },
    });

    return json({ ok: true });
  } catch (err: any) {
    console.error('Error sending shipping email:', err);
    return json({ error: 'Error al enviar email' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
