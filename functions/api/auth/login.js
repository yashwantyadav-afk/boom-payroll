import { sb } from '../../lib/supabase.js';
import { verifyPassword, signJWT } from '../../lib/crypto.js';
import { json } from '../../lib/http.js';

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;
    if (!username || !password) return json({ error: 'username and password required' }, 400);

    const S = sb(env);
    const { data } = await S.select('users', { columns: '*', filters: [['username', 'eq.' + username], ['active', 'eq.true']], limit: 1 });
    const u = data[0];
    const ok = u ? await verifyPassword(password, u.password_hash) : false;
    if (!u || !ok) return json({ error: 'invalid username or password' }, 401);

    await S.insert('audit_log', { actor: username, action: 'login', detail: { role: u.role } });
    const token = await signJWT(
      { sub: u.id, role: u.role, plant: u.plant, emp_id: u.emp_id, name: u.name, exp: Math.floor(Date.now() / 1000) + 12 * 3600 },
      env.JWT_SECRET
    );
    return json({ token, user: { id: u.id, username: u.username, role: u.role, name: u.name, plant: u.plant, emp_id: u.emp_id } });
  } catch (e) {
    return json({ error: 'Login failed: ' + (e.message || 'server error') }, 500);
  }
}
