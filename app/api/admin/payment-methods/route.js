import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
    const db = getDb();
    const res = await db.execute('SELECT * FROM payment_methods ORDER BY id DESC');
    return Response.json({ methods: res.rows });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
    const { type, name, details } = await req.json();
    const db = getDb();
    await db.execute({ sql: 'INSERT INTO payment_methods (type, name, details) VALUES (?, ?, ?)', args: [type, name, details || ''] });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
    const { id, is_active } = await req.json();
    const db = getDb();
    await db.execute({ sql: 'UPDATE payment_methods SET is_active = ? WHERE id = ?', args: [is_active, id] });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
    const { id } = await req.json();
    const db = getDb();
    await db.execute({ sql: 'DELETE FROM payment_methods WHERE id = ?', args: [id] });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
