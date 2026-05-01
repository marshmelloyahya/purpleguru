import { getDb } from '@/lib/db';
import { getCurrentUser, createSessionsTable } from '@/lib/auth';

export async function GET() {
  createSessionsTable();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const users = db.prepare('SELECT id, uuid, name, email, plan, role, is_banned, email_verified, daily_text_used, daily_image_used, daily_video_used, created_at FROM users ORDER BY created_at DESC').all();
  return Response.json({ users });
}

export async function PATCH(req) {
  createSessionsTable();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const { userId, action, value } = await req.json();
  if (!userId || !action) return Response.json({ error: 'Missing params' }, { status: 400 });

  if (action === 'ban') db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(value ? 1 : 0, userId);
  else if (action === 'plan') db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(value, userId);
  else if (action === 'role') db.prepare('UPDATE users SET role = ? WHERE id = ?').run(value, userId);
  else if (action === 'delete') db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  else return Response.json({ error: 'Unknown action' }, { status: 400 });

  return Response.json({ success: true });
}
