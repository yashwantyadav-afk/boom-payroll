import { sb, baseUrl } from '../lib/supabase.js';
import { json } from '../lib/http.js';

export async function onRequestGet(context) {
  const { env } = context;
  let urlHost = '(not set)';
  try { urlHost = new URL(baseUrl(env)).host; } catch (e) { urlHost = '(invalid: "' + (env.SUPABASE_URL || '') + '")'; }
  const settings = {
    SUPABASE_URL_host: urlHost,
    SUPABASE_SERVICE_KEY: env.SUPABASE_SERVICE_KEY ? 'set' : 'MISSING',
    JWT_SECRET: env.JWT_SECRET ? 'set' : 'MISSING',
  };
  let database = 'not checked';
  try {
    const S = sb(env);
    const { data } = await S.select('users', { columns: 'id', limit: 1 });
    database = data.length ? 'connected — users table has data' : 'connected — but users table is EMPTY (run seed.sql)';
  } catch (e) {
    database = 'ERROR: ' + (e.message || 'could not reach database');
  }
  return json({ ok: true, ts: new Date().toISOString(), settings, database });
}
