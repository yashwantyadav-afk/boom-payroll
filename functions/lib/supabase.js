import { createClient } from '@supabase/supabase-js';
// Server-side client using the SERVICE ROLE key (never exposed to the browser).
// These functions run on Cloudflare; the key lives in a Cloudflare secret.
export function db(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
}
