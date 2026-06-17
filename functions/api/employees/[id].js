import { db } from '../../lib/supabase.js';
import { can } from '../../lib/rbac.js';
import { json } from '../../lib/http.js';

const COLS = 'id,emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,pan,uan,sap_code,regime,decl80c,photo_ref';

export async function onRequestGet(context) {
  const { env, params, data } = context;
  const user = data.user;
  if (!can(user.role, 'employee.read') && !can(user.role, 'self.read')) return json({ error: 'forbidden' }, 403);

  const sb = db(env);
  const { data: e } = await sb.from('employees').select(COLS).eq('id', params.id).maybeSingle();
  if (!e) return json({ error: 'not found' }, 404);
  if (user.role === 'ess' && Number(user.emp_id) !== Number(e.id)) return json({ error: 'forbidden' }, 403);
  return json(e);
}
