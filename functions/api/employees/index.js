import { db } from '../../lib/supabase.js';
import { can } from '../../lib/rbac.js';
import { json } from '../../lib/http.js';

const COLS = 'id,emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,pan,uan,sap_code,regime,decl80c,photo_ref';

export async function onRequestGet(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!can(user.role, 'employee.read')) return json({ error: 'forbidden' }, 403);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
  const size = Math.min(200, Math.max(1, parseInt(url.searchParams.get('size')) || 25));
  const q = (url.searchParams.get('q') || '').trim();
  const from = (page - 1) * size;

  const sb = db(env);
  let query = sb.from('employees').select(COLS, { count: 'exact' }).eq('active', true);
  if (user.role === 'ess') query = query.eq('id', user.emp_id);
  else if (user.plant) query = query.eq('plant', user.plant);
  if (q) query = query.or(`name.ilike.%${q}%,emp_code.ilike.%${q}%,role.ilike.%${q}%,state.ilike.%${q}%`);
  query = query.order('id').range(from, from + size - 1);

  const { data: rows, count, error } = await query;
  if (error) return json({ error: error.message }, 500);
  return json({ rows: rows || [], total: count || 0, page, size, pages: Math.max(1, Math.ceil((count || 0) / size)) });
}

const WRITABLE = ['emp_code','name','role','ctc','state','plant','dept','contractor_id','bank_id','pan','uan','sap_code','regime','decl80c'];

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!can(data.user.role, 'employee.write')) return json({ error: 'forbidden' }, 403);
  const b = await request.json().catch(() => ({}));
  if (!b.name || !b.emp_code) return json({ error: 'name and emp_code are required' }, 400);

  const sb = db(env);
  const { data: dup } = await sb.from('employees').select('id').eq('emp_code', b.emp_code).maybeSingle();
  if (dup) return json({ error: 'emp_code already exists' }, 409);

  const row = {};
  for (const k of WRITABLE) if (b[k] !== undefined) row[k] = b[k];
  const { data: created, error } = await sb.from('employees').insert(row).select(COLS).single();
  if (error) return json({ error: error.message }, 500);
  await sb.from('audit_log').insert({ actor: data.user.name || data.user.role, action: 'employee.create', detail: { id: created.id } });
  return json(created, 201);
}
