import { defineMiddleware } from 'astro:middleware';

// Security headers applied to every response.
// CSP whitelists the third-party origins the app actually uses
// (Stripe, Firebase, Google Identity, Geoapify, Resend assets, Google Fonts).
const CSP = [
  "default-src 'self'",
  // Allow inline + Stripe + Google scripts. 'unsafe-inline' kept because Astro
  // emits inline hydration scripts; tighten with hashes/nonces later if desired.
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://api.stripe.com https://api.geoapify.com wss://*.firebaseio.com",
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

export const onRequest = defineMiddleware(async (ctx, next) => {
  const response = await next();

  // Don't override headers set explicitly by API routes (e.g. Stripe webhook needs raw response)
  const headers = response.headers;

  if (!headers.has('Content-Security-Policy')) {
    headers.set('Content-Security-Policy', CSP);
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")'
  );
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-DNS-Prefetch-Control', 'off');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  return response;
});
