import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const db = getDb();
    const methods = db.prepare('SELECT * FROM payment_methods ORDER BY id DESC').all();
    return Response.json({ methods });
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
    
    db.prepare('INSERT INTO payment_methods (type, name, details) VALUES (?, ?, ?)').run(type, name, details || '');
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
    db.prepare('UPDATE payment_methods SET is_active = ? WHERE id = ?').run(is_active, id);
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
    db.prepare('DELETE FROM payment_methods WHERE id = ?').run(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
