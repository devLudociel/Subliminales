import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

let _app: App | null = null;

function getApp(): App {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length) {
    _app = existing[0];
    return _app;
  }

  const raw = import.meta.env.FIREBASE_SERVICE_ACCOUNT_JSON as string | undefined;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON env var missing. ' +
      'Required for server-side Firebase Admin SDK (auth verification, secure Firestore writes).'
    );
  }

  // Accept raw JSON or base64-encoded JSON
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    try {
      json = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (e) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON or base64-encoded JSON');
    }
  }

  // Normalize private key newlines (Vercel often stores them escaped)
  if (json.private_key && typeof json.private_key === 'string') {
    json.private_key = json.private_key.replace(/\\n/g, '\n');
  }

  _app = initializeApp({
    credential: cert(json),
    projectId: json.project_id ?? import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  });
  return _app;
}

export const adminAuth = () => getAdminAuth(getApp());
export const adminDb = () => getAdminFirestore(getApp());

export const ADMIN_EMAIL = 'rubenjruiz1441@gmail.com';
