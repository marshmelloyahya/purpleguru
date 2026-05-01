import { getDb } from '@/lib/db';

export async function POST(req) {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    
    // Attempt to update today's stats, insert if not exists
    const stmt = db.prepare(`
      INSERT INTO analytics (date, visitors, pageviews) 
      VALUES (?, 1, 1) 
      ON CONFLICT(date) DO UPDATE SET pageviews = pageviews + 1
    `);
    stmt.run(today);

    // This is a naive hit tracker. To track unique visitors, we need to track sessions.
    // For now, pageviews increments every hit. 
    // We could accept a 'new_visitor' boolean in the body to increment visitors.
    const { newVisitor } = await req.json().catch(() => ({ newVisitor: false }));
    if (newVisitor) {
      db.prepare(`UPDATE analytics SET visitors = visitors + 1 WHERE date = ?`).run(today);
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const stats = db.prepare(`SELECT * FROM analytics ORDER BY date DESC LIMIT 30`).all();
    return Response.json({ stats });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
