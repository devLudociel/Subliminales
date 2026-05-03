import { Resend } from 'resend';

const resend = new Resend(import.meta.env.RESEND_API_KEY as string);

const FROM    = 'Subliminal.es <onboarding@resend.dev>'; // swap to pedidos@subliminal.es when domain verified
const ADMIN   = 'rubenjruiz1441@gmail.com';
const BRAND   = '#f72585';
const MINT    = '#4cc9a0';
const DARK    = '#111111';

// ── Helpers ───────────────────────────────────────────────────────────────────

function shippingLabel(method: string) {
  if (method === 'express') return '⚡ Urgente 24/48h';
  if (method === 'free')    return '🎉 Envío gratis';
  return '📦 Estándar 3-5 días';
}

function itemsHtml(items: Array<{ name?: string; productId: string; size?: string; color?: string; quantity: number }>) {
  return items.map(item => {
    const variant = [item.size, item.color].filter(Boolean).join(' / ');
    return `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f0e0e8; font-family:'Helvetica Neue',Arial,sans-serif; font-size:16px; color:${DARK};">
          ${item.name || item.productId}${variant ? ` <span style="color:#888">— ${variant}</span>` : ''}
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #f0e0e8; font-family:'Helvetica Neue',Arial,sans-serif; font-size:16px; color:#888; text-align:right;">
          ×${item.quantity}
        </td>
      </tr>`;
  }).join('');
}

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fef0f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef0f4;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND};padding:28px 40px;border-radius:12px 12px 0 0;border:2px solid ${DARK};">
            <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:1px;font-family:Georgia,serif;">SUBLIMINAL.ES</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:40px;border-left:2px solid ${DARK};border-right:2px solid ${DARK};">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:${MINT};padding:20px 40px;border-radius:0 0 12px 12px;border:2px solid ${DARK};border-top:none;text-align:center;">
            <p style="margin:0;color:${DARK};font-size:14px;">Ropa con chiste desde 2025 · <a href="https://subliminal.es" style="color:${DARK};">subliminal.es</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email: order confirmation to customer ─────────────────────────────────────

export async function sendOrderConfirmation(order: {
  stripeSessionId: string;
  amountTotal: number;
  shippingMethod: string;
  taxNote: string;
  customer: { name: string; email: string; address: string; city: string; province?: string; zip: string };
  items: Array<{ name?: string; productId: string; size?: string; color?: string; quantity: number }>;
}) {
  const shortId = order.stripeSessionId.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
  const address = [order.customer.address, order.customer.zip, order.customer.city, order.customer.province].filter(Boolean).join(', ');

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;color:${BRAND};font-size:26px;font-family:Georgia,serif;">¡Pedido confirmado! 🎉</h2>
    <p style="margin:0 0 28px;color:#666;font-size:16px;">Hola ${order.customer.name}, hemos recibido tu pedido y lo estamos preparando.</p>

    <div style="background:#fef0f4;border:2px solid ${DARK};border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;">Nº de pedido</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:${DARK};font-family:monospace;">#${shortId}</p>
    </div>

    <h3 style="margin:0 0 12px;color:${DARK};font-size:18px;">Artículos</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${itemsHtml(order.items)}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="font-size:14px;color:#888;padding:4px 0;">Envío</td>
        <td style="font-size:14px;color:${DARK};text-align:right;padding:4px 0;">${shippingLabel(order.shippingMethod)}</td>
      </tr>
      <tr>
        <td style="font-size:14px;color:#888;padding:4px 0;">IVA</td>
        <td style="font-size:14px;color:${DARK};text-align:right;padding:4px 0;">${order.taxNote}</td>
      </tr>
      <tr>
        <td style="font-size:18px;font-weight:bold;color:${DARK};padding:12px 0 0;border-top:2px solid #f0e0e8;">Total</td>
        <td style="font-size:22px;font-weight:bold;color:${BRAND};text-align:right;padding:12px 0 0;border-top:2px solid #f0e0e8;">${order.amountTotal.toFixed(2)}€</td>
      </tr>
    </table>

    <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:8px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;">Dirección de entrega</p>
      <p style="margin:0;font-size:16px;color:${DARK};">${address}</p>
    </div>

    <p style="margin:0;color:#666;font-size:15px;line-height:1.6;">
      Te avisaremos cuando tu pedido esté en camino con el número de seguimiento.
      Si tienes alguna duda, responde a este email. 😊
    </p>
  `);

  return resend.emails.send({
    from:    FROM,
    to:      order.customer.email,
    subject: `✅ Pedido confirmado #${shortId} — Subliminal.es`,
    html,
  });
}

// ── Email: new order notification to admin ────────────────────────────────────

export async function sendAdminNewOrder(order: {
  stripeSessionId: string;
  amountTotal: number;
  shippingMethod: string;
  customer: { name: string; email: string; address: string; city: string; province?: string; zip: string };
  items: Array<{ name?: string; productId: string; size?: string; color?: string; quantity: number }>;
}) {
  const shortId = order.stripeSessionId.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();
  const address = [order.customer.address, order.customer.zip, order.customer.city, order.customer.province].filter(Boolean).join(', ');

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;color:${DARK};font-size:26px;font-family:Georgia,serif;">🛍️ Nuevo pedido recibido</h2>
    <p style="margin:0 0 24px;color:#666;">Alguien ha comprado. Ve a prepararlo.</p>

    <div style="background:#fef0f4;border:2px solid ${BRAND};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#888;text-transform:uppercase;">Pedido · ${order.amountTotal.toFixed(2)}€</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:${DARK};font-family:monospace;">#${shortId}</p>
    </div>

    <h3 style="margin:0 0 12px;color:${DARK};">Cliente</h3>
    <p style="margin:0 0 4px;font-size:16px;color:${DARK};font-weight:bold;">${order.customer.name}</p>
    <p style="margin:0 0 4px;font-size:16px;color:#666;">${order.customer.email}</p>
    <p style="margin:0 0 24px;font-size:16px;color:#666;">${address}</p>

    <h3 style="margin:0 0 12px;color:${DARK};">Artículos</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${itemsHtml(order.items)}
    </table>

    <a href="https://subliminales.vercel.app/admin/pedidos" style="display:inline-block;background:${DARK};color:${MINT};padding:14px 28px;border-radius:8px;font-size:16px;font-weight:bold;text-decoration:none;">
      Ver en panel admin →
    </a>
  `);

  return resend.emails.send({
    from:    FROM,
    to:      ADMIN,
    subject: `🛍️ Nuevo pedido #${shortId} — ${order.amountTotal.toFixed(2)}€`,
    html,
  });
}

// ── Email: shipping notification to customer ──────────────────────────────────

export async function sendShippingNotification(order: {
  stripeSessionId: string;
  trackingNumber: string;
  carrier: string;
  customer: { name: string; email: string };
}) {
  const shortId = order.stripeSessionId.replace('cs_', '').replace('test_', '').slice(0, 10).toUpperCase();

  const CARRIER_URLS: Record<string, string> = {
    'Correos': 'https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking=',
    'SEUR':    'https://www.seur.com/livetracking/?segOnlineIdentificador=',
    'MRW':     'https://www.mrw.es/seguimiento_envios/buscador_dhl.asp?Num_Alb=',
    'GLS':     'https://gls-group.com/track/',
    'DHL':     'https://www.dhl.com/es-es/home/tracking/tracking-express.html?submit=1&tracking-id=',
    'UPS':     'https://www.ups.com/track?tracknum=',
  };

  const trackingUrl = (CARRIER_URLS[order.carrier] ?? '') + order.trackingNumber;

  const html = baseLayout(`
    <h2 style="margin:0 0 8px;color:${BRAND};font-size:26px;font-family:Georgia,serif;">¡Tu pedido está en camino! 🚚</h2>
    <p style="margin:0 0 28px;color:#666;font-size:16px;">Hola ${order.customer.name}, tu pedido #${shortId} ha salido.</p>

    <div style="background:#fef0f4;border:2px solid ${DARK};border-radius:8px;padding:24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;color:#888;text-transform:uppercase;letter-spacing:1px;">${order.carrier} · Nº de seguimiento</p>
      <p style="margin:0 0 20px;font-size:28px;font-weight:bold;color:${DARK};font-family:monospace;letter-spacing:2px;">${order.trackingNumber}</p>
      <a href="${trackingUrl}" style="display:inline-block;background:${BRAND};color:#fff;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold;text-decoration:none;">
        Seguir mi paquete →
      </a>
    </div>

    <p style="margin:0;color:#666;font-size:15px;line-height:1.6;">
      También puedes seguir el estado desde
      <a href="https://subliminal.es/perfil" style="color:${BRAND};">tu panel de pedidos</a>.
    </p>
  `);

  return resend.emails.send({
    from:    FROM,
    to:      order.customer.email,
    subject: `🚚 Tu pedido #${shortId} está en camino — ${order.carrier}`,
    html,
  });
}
