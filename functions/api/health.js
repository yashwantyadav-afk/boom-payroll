import { sb } from '../lib/supabase.js';
import { json } from '../lib/http.js';

export async function onRequestGet(context) {
  const { env } = context;
  const settings = {
    SUPABASE_URL: !!env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!env.SUPABASE_SERVICE_KEY,
    JWT_SECRET: !!env.JWT_SECRET,
  };
  let database = 'not checked';
  try {
    const S = sb(env);
    const { data } = await S.select('users', { columns: 'id', limit: 1 });
    database = `connected — ${data.length ? 'users table has data' : 'users table is EMPTY (run seed.sql)'}`;
  } catch (e) {
    database = 'ERROR: ' + (e.message || 'could not reach database');
  }
  return json({ ok: true, ts: new Date().toISOString(), settings, database });
}
