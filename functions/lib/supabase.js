// Minimal Supabase access over its built-in REST API (PostgREST) using fetch.
// No npm package required, so nothing needs to be installed/bundled by Cloudflare.
// Uses the SERVICE ROLE key (server-side only; kept in a Cloudflare secret).
export function sb(env) {
  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const baseHeaders = {
    apikey: env.SUPABASE_SERVICE_KEY,
    Authorization: 'Bearer ' + env.SUPABASE_SERVICE_KEY,
    'Content-Type': 'application/json',
  };
  return {
    // filters: array of [key, value], e.g. ['id','eq.5'] or ['or','(a.ilike.*x*,b.eq.1)']
    async select(table, { columns = '*', filters = [], order, limit, offset, count } = {}) {
      const p = new URLSearchParams();
      p.set('select', columns);
      for (const [k, v] of filters) p.append(k, v);
      if (order) p.set('order', order);
      if (limit != null) p.set('limit', String(limit));
      if (offset != null) p.set('offset', String(offset));
      const headers = { ...baseHeaders };
      if (count) headers.Prefer = 'count=exact';
      const r = await fetch(`${base}/${table}?${p.toString()}`, { headers });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error((data && data.message) || `HTTP ${r.status}`);
      let total = null;
      if (count) { const cr = r.headers.get('content-range'); total = cr ? parseInt(cr.split('/')[1]) : (data ? data.length : 0); }
      return { data: data || [], total };
    },
    async insert(table, row, { returning = false } = {}) {
      const headers = { ...baseHeaders };
      if (returning) headers.Prefer = 'return=representation';
      const r = await fetch(`${base}/${table}`, { method: 'POST', headers, body: JSON.stringify(row) });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error((data && data.message) || `HTTP ${r.status}`);
      return data;
    },
    async update(table, patch, filters = []) {
      const p = new URLSearchParams();
      for (const [k, v] of filters) p.append(k, v);
      const headers = { ...baseHeaders, Prefer: 'return=representation' };
      const r = await fetch(`${base}/${table}?${p.toString()}`, { method: 'PATCH', headers, body: JSON.stringify(patch) });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error((data && data.message) || `HTTP ${r.status}`);
      return data;
    },
  };
}
