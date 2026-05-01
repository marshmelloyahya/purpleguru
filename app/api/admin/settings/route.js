import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const res = await db.execute('SELECT key, value FROM settings');
  const settings = res.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  return Response.json({ settings });
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  const db = getDb();
  const data = await req.json();

  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      await db.execute({
        sql: `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=datetime('now')`,
        args: [key, String(value)],
      });
    }
  }

  return Response.json({ success: true });
}
