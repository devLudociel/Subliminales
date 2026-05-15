import type { APIRoute } from 'astro';
import { sendShippingNotification } from '../../../lib/emails';
import { verifyAdmin } from '../../../lib/auth';
import { rateLimit, clientIp, maybeGc } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request }) => {
  try {
    maybeGc();
    const ip = clientIp(request);
    const rl = rateLimit(`shipemail:${ip}`, 30, 60_000);
    if (!rl.ok) return json({ error: 'Demasiadas peticiones' }, 429);

    const auth = await verifyAdmin(request);
    if (!auth.ok) return json({ error: auth.error }, auth.status);

    const body = await request.json();
    const { stripeSessionId, trackingNumber, carrier, customerName, customerEmail } = body ?? {};

    if (!trackingNumber || !carrier || !customerEmail) {
      return json({ error: 'Faltan datos de envío' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customerEmail))) {
      return json({ error: 'Email inválido' }, 400);
    }
    if (String(trackingNumber).length > 80 || String(carrier).length > 40) {
      return json({ error: 'Datos demasiado largos' }, 400);
    }

    await sendShippingNotification({
      stripeSessionId: String(stripeSessionId ?? ''),
      trackingNumber: String(trackingNumber),
      carrier: String(carrier),
      customer: { name: String(customerName ?? ''), email: String(customerEmail) },
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
