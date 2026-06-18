import { sb } from '../../lib/supabase.js';
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

  const filters = [['active', 'eq.true']];
  if (user.role === 'ess') filters.push(['id', 'eq.' + user.emp_id]);
  else if (user.plant) filters.push(['plant', 'eq.' + user.plant]);
  if (q) filters.push(['or', `(name.ilike.*${q}*,emp_code.ilike.*${q}*,role.ilike.*${q}*,state.ilike.*${q}*)`]);

  const S = sb(env);
  const { data: rows, total } = await S.select('employees', { columns: COLS, filters, order: 'id', limit: size, offset: from, count: true });
  return json({ rows, total, page, size, pages: Math.max(1, Math.ceil((total || 0) / size)) });
}

const WRITABLE = ['emp_code','name','role','ctc','state','plant','dept','contractor_id','bank_id','pan','uan','sap_code','regime','decl80c'];

export async function onRequestPost(context) {
  const { request, env, data } = context;
  if (!can(data.user.role, 'employee.write')) return json({ error: 'forbidden' }, 403);
  const b = await request.json().catch(() => ({}));
  if (!b.name || !b.emp_code) return json({ error: 'name and emp_code are required' }, 400);

  const S = sb(env);
  const { data: dup } = await S.select('employees', { columns: 'id', filters: [['emp_code', 'eq.' + b.emp_code]], limit: 1 });
  if (dup.length) return json({ error: 'emp_code already exists' }, 409);

  const row = {};
  for (const k of WRITABLE) if (b[k] !== undefined) row[k] = b[k];
  const created = (await S.insert('employees', row, { returning: true }))[0];
  await S.insert('audit_log', { actor: data.user.name || data.user.role, action: 'employee.create', detail: { id: created.id } });
  return json(created, 201);
}
