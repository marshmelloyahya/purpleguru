import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const plans = db.prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY id ASC').all();
    plans.forEach(p => p.features = JSON.parse(p.features));
    return Response.json({ plans });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
