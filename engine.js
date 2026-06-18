import { sb } from '../../lib/supabase.js';
import { can } from '../../lib/rbac.js';
import { json } from '../../lib/http.js';
import { compute } from '../../lib/engine.js';

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!can(user.role, 'payroll.run')) return json({ error: 'forbidden' }, 403);
  const { month, year } = await request.json().catch(() => ({}));
  if (!month || !year) return json({ error: 'month and year are required' }, 400);

  const S = sb(env);
  const { data: cfgRows } = await S.select('config', { columns: 'value', filters: [['key', 'eq.statutory']], limit: 1 });
  const cfg = cfgRows[0] ? cfgRows[0].value : undefined;

  const empFilters = [['active', 'eq.true']];
  if (user.plant) empFilters.push(['plant', 'eq.' + user.plant]);
  const { data: emps } = await S.select('employees', { columns: 'id,ctc,state,regime,decl80c,plant', filters: empFilters, order: 'id', limit: 5000 });

  const run = (await S.insert('payroll_runs', { period_month: month, period_year: year, status: 'Draft', run_by: user.sub }, { returning: true }))[0];

  const totals = { count: 0, gross: 0, net: 0, pf: 0, esi: 0, pt: 0, tds: 0, lwf: 0, ctc: 0 };
  const slips = [];
  for (const e of emps) {
    const { data: attRows } = await S.select('attendance', { columns: 'total_days,lop', filters: [['emp_id', 'eq.' + e.id], ['period_month', 'eq.' + month], ['period_year', 'eq.' + year]], limit: 1 });
    const att = attRows[0] ? { totalDays: attRows[0].total_days, lop: attRows[0].lop } : null;
    const c = compute({ ctc: Number(e.ctc), state: e.state, regime: e.regime, decl80c: Number(e.decl80c || 0) }, att, cfg);
    slips.push({ run_id: run.id, emp_id: e.id, net: c.net, breakdown: c });
    totals.count++; totals.gross += c.eGross; totals.net += c.net; totals.pf += c.eePF;
    totals.esi += c.eeESI; totals.pt += c.pt; totals.tds += c.tds; totals.lwf += c.lwf; totals.ctc += c.ctcMonthly;
  }
  if (slips.length) await S.insert('payslips', slips);
  await S.update('payroll_runs', { totals }, [['id', 'eq.' + run.id]]);
  await S.insert('audit_log', { actor: user.name || user.role, action: 'payroll.run', detail: { run: run.id, month, year, count: totals.count } });
  return json({ run_id: run.id, month, year, totals }, 201);
}

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!can(data.user.role, 'payroll.read')) return json({ error: 'forbidden' }, 403);
  const S = sb(env);
  const { data: rows } = await S.select('payroll_runs', { columns: 'id,period_month,period_year,status,run_at,totals', order: 'id.desc', limit: 50 });
  return json({ rows });
}
