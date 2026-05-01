import { getDb } from '@/lib/db';
import { getCurrentUser, createSessionsTable } from '@/lib/auth';

export async function GET() {
  createSessionsTable();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const tickets = db.prepare(`
    SELECT t.*, u.name, u.email,
      (SELECT COUNT(*) FROM ticket_replies WHERE ticket_id = t.id) as reply_count
    FROM tickets t LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.updated_at DESC
  `).all();
  return Response.json({ tickets });
}

export async function PATCH(req) {
  createSessionsTable();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const { ticketId, status, reply } = await req.json();

  if (status) {
    db.prepare('UPDATE tickets SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, ticketId);
  }
  if (reply) {
    db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, is_admin, message) VALUES (?, ?, 1, ?)').run(ticketId, user.id, reply);
    db.prepare('UPDATE tickets SET updated_at = datetime("now") WHERE id = ?').run(ticketId);
  }
  return Response.json({ success: true });
}
