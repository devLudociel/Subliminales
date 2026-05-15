import type { APIRoute } from 'astro';
import { adminDb } from '../../lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { rateLimit, clientIp, maybeGc } from '../../lib/rate-limit';
import { escapeHtml } from '../../lib/escape';

const resend = new Resend(import.meta.env.RESEND_API_KEY as string);

export const POST: APIRoute = async ({ request }) => {
  try {
    maybeGc();
    const ip = clientIp(request);
    const rl = rateLimit(`newsletter:${ip}`, 5, 60_000);
    if (!rl.ok) return json({ error: 'Demasiadas peticiones' }, 429);

    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Email inválido' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim().slice(0, 254);

    const existing = await adminDb()
      .collection('newsletter')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();
    if (!existing.empty) {
      return json({ ok: true, alreadySubscribed: true });
    }

    await adminDb().collection('newsletter').add({
      email: normalizedEmail,
      createdAt: FieldValue.serverTimestamp(),
      source: 'homepage',
      ip,
    });

    const safeEmail = escapeHtml(normalizedEmail);

    try {
      await resend.emails.send({
        from: 'Subliminal.es <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: '¡Bienvenido/a a Subliminal.es! 🎉',
        html: `<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#fef0f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef0f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:#f72585;padding:28px 40px;border-radius:12px 12px 0 0;border:2px solid #111;">
          <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px;font-family:Georgia,serif;">SUBLIMINAL.ES</h1>
        </td></tr>
        <tr><td style="background:#fff;padding:40px;border-left:2px solid #111;border-right:2px solid #111;">
          <h2 style="color:#f72585;font-size:24px;margin:0 0 16px;">¡Ya eres parte del chiste! 🤣</h2>
          <p style="color:#666;font-size:16px;line-height:1.6;margin:0 0 20px;">
            Hola ${safeEmail}, a partir de ahora serás el/la primero/a en enterarte de los nuevos drops, ofertas exclusivas y... más chistes.
          </p>
          <a href="https://subliminal.es/tienda" style="display:inline-block;background:#111;color:#4cc9a0;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:bold;text-decoration:none;">
            Ver la tienda →
          </a>
        </td></tr>
        <tr><td style="background:#4cc9a0;padding:20px 40px;border-radius:0 0 12px 12px;border:2px solid #111;border-top:none;text-align:center;">
          <p style="margin:0;color:#111;font-size:14px;">Ropa con chiste desde 2025 · <a href="https://subliminal.es" style="color:#111;">subliminal.es</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
    } catch {}

    return json({ ok: true });
  } catch (err) {
    console.error('Newsletter error:', err);
    return json({ error: 'Error al suscribirse' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
