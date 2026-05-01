import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  const adminUser = await getCurrentUser();
  if (!adminUser || adminUser.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const { userSearch, subject, message } = await req.json();

  if (!userSearch || !subject || !message) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Find user by ID or Name
  const targetUser = db.prepare('SELECT id FROM users WHERE id = ? OR name LIKE ? OR email = ? LIMIT 1')
    .get(userSearch, `%${userSearch}%`, userSearch);

  if (!targetUser) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const ticketUuid = uuidv4();
  const info = db.prepare('INSERT INTO tickets (uuid, user_id, subject, status, priority) VALUES (?, ?, ?, ?, ?)')
    .run(ticketUuid, targetUser.id, subject, 'open', 'high');

  db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, is_admin, message) VALUES (?, ?, 1, ?)')
    .run(info.lastInsertRowid, adminUser.id, message);

  return Response.json({ success: true, ticketId: info.lastInsertRowid });
}
