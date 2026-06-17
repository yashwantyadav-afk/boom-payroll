import { json } from '../lib/http.js';
export const onRequestGet = () => json({ ok: true, ts: new Date().toISOString() });
