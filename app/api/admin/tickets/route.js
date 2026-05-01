import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const res = await db.execute(`SELECT t.*, u.name, u.email, (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count FROM tickets t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.updated_at DESC`);
  return Response.json({ tickets: res.rows });
}

export async function PATCH(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const { ticketId, status, reply } = await req.json();

  if (status) {
    await db.execute({ sql: 'UPDATE tickets SET status = ?, updated_at = datetime("now") WHERE id = ?', args: [status, ticketId] });
  }
  if (reply) {
    await db.execute({ sql: 'INSERT INTO ticket_replies (ticket_id, user_id, is_admin, message) VALUES (?, ?, 1, ?)', args: [ticketId, user.id, reply] });
    await db.execute({ sql: 'UPDATE tickets SET updated_at = datetime("now") WHERE id = ?', args: [ticketId] });
  }
  return Response.json({ success: true });
}
