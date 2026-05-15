import { adminAuth, ADMIN_EMAIL } from './firebase/admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthResult {
  ok: true;
  user: DecodedIdToken;
}
export interface AuthError {
  ok: false;
  status: number;
  error: string;
}

function extractToken(request: Request): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header);
  return m ? m[1].trim() : null;
}

export async function verifyUser(request: Request): Promise<AuthResult | AuthError> {
  const token = extractToken(request);
  if (!token) return { ok: false, status: 401, error: 'Token requerido' };
  try {
    const decoded = await adminAuth().verifyIdToken(token, true);
    return { ok: true, user: decoded };
  } catch {
    return { ok: false, status: 401, error: 'Token inválido' };
  }
}

export async function verifyAdmin(request: Request): Promise<AuthResult | AuthError> {
  const r = await verifyUser(request);
  if (!r.ok) return r;
  if ((r.user.email || '').toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { ok: false, status: 403, error: 'No autorizado' };
  }
  return r;
}
