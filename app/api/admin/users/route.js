import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const res = await db.execute('SELECT id, uuid, name, email, plan, role, is_banned, email_verified, daily_text_used, daily_image_used, daily_video_used, created_at FROM users ORDER BY created_at DESC');
  return Response.json({ users: res.rows });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const { userId, action, value } = await req.json();
  if (!userId || !action) return Response.json({ error: 'Missing params' }, { status: 400 });

  if (action === 'ban') await db.execute({ sql: 'UPDATE users SET is_banned = ? WHERE id = ?', args: [value ? 1 : 0, userId] });
  else if (action === 'plan') await db.execute({ sql: 'UPDATE users SET plan = ? WHERE id = ?', args: [value, userId] });
  else if (action === 'role') await db.execute({ sql: 'UPDATE users SET role = ? WHERE id = ?', args: [value, userId] });
  else if (action === 'delete') await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [userId] });
  else return Response.json({ error: 'Unknown action' }, { status: 400 });

  return Response.json({ success: true });
}
