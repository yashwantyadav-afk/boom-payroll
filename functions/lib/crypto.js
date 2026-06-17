// Password hashing + JWT using Web Crypto (works on the Cloudflare runtime).
const enc = new TextEncoder();
const b64u = (b) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uToBytes = (s) => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export async function hashPassword(pw, iterations = 100000) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
  return `pbkdf2$${iterations}$${b64u(salt)}$${b64u(bits)}`;
}

export async function verifyPassword(pw, stored) {
  if (!stored) return false;
  const [scheme, iter, saltB, hashB] = stored.split('$');
  if (scheme !== 'pbkdf2') return false;
  const salt = b64uToBytes(saltB);
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: +iter, hash: 'SHA-256' }, key, 256);
  return b64u(bits) === hashB;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signJWT(payload, secret) {
  const header = b64u(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64u(enc.encode(JSON.stringify(payload)));
  const data = header + '.' + body;
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(data));
  return data + '.' + b64u(sig);
}

export async function verifyJWT(token, secret) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  const [h, b, s] = parts;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), b64uToBytes(s), enc.encode(h + '.' + b));
  if (!ok) throw new Error('bad signature');
  const payload = JSON.parse(new TextDecoder().decode(b64uToBytes(b)));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('expired');
  return payload;
}
