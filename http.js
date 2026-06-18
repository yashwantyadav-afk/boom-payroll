import { verifyJWT } from '../lib/crypto.js';
import { json } from '../lib/http.js';

export async function onRequest(context) {
  const { request, env, next, data } = context;
  const path = new URL(request.url).pathname;
  if (path === '/api/health' || path === '/api/auth/login') return next();

  const m = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!m) return json({ error: 'missing bearer token' }, 401);
  try {
    data.user = await verifyJWT(m[1], env.JWT_SECRET);
    return next();
  } catch (e) {
    return json({ error: 'invalid or expired token' }, 401);
  }
}
