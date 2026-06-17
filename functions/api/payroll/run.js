import { db } from '../../lib/supabase.js';
import { can } from '../../lib/rbac.js';
import { json } from '../../lib/http.js';
import { compute } from '../../lib/engine.js';

export async function onRequestPost(context) {
  const { request, env, data } = context;
  const user = data.user;
  if (!can(user.role, 'payroll.run')) return json({ error: 'forbidden' }, 403);
  const { month, year } = await request.json().catch(() => ({}));
  if (!month || !year) return json({ error: 'month and year are required' }, 400);

  const sb = db(env);
  const { data: cfgRow } = await sb.from('config').select('value').eq('key', 'statutory').maybeSingle();
  const cfg = cfgRow ? cfgRow.value : undefined;

  let eq = sb.from('employees').select('id,ctc,state,regime,decl80c,plant').eq('active', true);
  if (user.plant) eq = eq.eq('plant', user.plant);
  const { data: emps, error: empErr } = await eq.order('id');
  if (empErr) return json({ error: empErr.message }, 500);

  const { data: run, error: runErr } = await sb.from('payroll_runs')
    .insert({ period_month: month, period_year: year, status: 'Draft', run_by: user.sub }).select('id').single();
  if (runErr) return json({ error: runErr.message }, 500);

  const totals = { count: 0, gross: 0, net: 0, pf: 0, esi: 0, pt: 0, tds: 0, lwf: 0, ctc: 0 };
  const slips = [];
  for (const e of emps) {
    const { data: att } = await sb.from('attendance').select('total_days,lop')
      .eq('emp_id', e.id).eq('period_month', month).eq('period_year', year).maybeSingle();
    const attendance = att ? { totalDays: att.total_days, lop: att.lop } : null;
    const c = compute({ ctc: Number(e.ctc), state: e.state, regime: e.regime, decl80c: Number(e.decl80c || 0) }, attendance, cfg);
    slips.push({ run_id: run.id, emp_id: e.id, net: c.net, breakdown: c });
    totals.count++; totals.gross += c.eGross; totals.net += c.net; totals.pf += c.eePF;
    totals.esi += c.eeESI; totals.pt += c.pt; totals.tds += c.tds; totals.lwf += c.lwf; totals.ctc += c.ctcMonthly;
  }
  if (slips.length) await sb.from('payslips').insert(slips);
  await sb.from('payroll_runs').update({ totals }).eq('id', run.id);
  await sb.from('audit_log').insert({ actor: user.name || user.role, action: 'payroll.run', detail: { run: run.id, month, year, count: totals.count } });
  return json({ run_id: run.id, month, year, totals }, 201);
}

export async function onRequestGet(context) {
  const { env, data } = context;
  if (!can(data.user.role, 'payroll.read')) return json({ error: 'forbidden' }, 403);
  const sb = db(env);
  const { data: rows } = await sb.from('payroll_runs').select('id,period_month,period_year,status,run_at,totals').order('id', { ascending: false }).limit(50);
  return json({ rows: rows || [] });
}
