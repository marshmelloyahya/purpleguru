import { getDb } from '@/lib/db';
import { getCurrentUser, createSessionsTable } from '@/lib/auth';

// GET /api/admin/stats
export async function GET() {
  try {
    createSessionsTable();
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const db = getDb();
    const stats = {
      totalUsers: db.prepare('SELECT COUNT(*) as c FROM users WHERE role != ?').get('admin').c,
      activeToday: db.prepare(`SELECT COUNT(DISTINCT user_id) as c FROM usage_logs WHERE date(created_at) = date('now') AND user_id IS NOT NULL`).get().c,
      totalGenerations: db.prepare('SELECT COUNT(*) as c FROM usage_logs').get().c,
      generationsToday: db.prepare(`SELECT COUNT(*) as c FROM usage_logs WHERE date(created_at) = date('now')`).get().c,
      totalRevenue: db.prepare(`SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE status = 'completed'`).get().s,
      openTickets: db.prepare(`SELECT COUNT(*) as c FROM tickets WHERE status = 'open'`).get().c,
      apiKeys: db.prepare('SELECT COUNT(*) as c FROM api_keys WHERE is_active = 1 AND is_working = 1').get().c,
      proUsers: db.prepare(`SELECT COUNT(*) as c FROM users WHERE plan = 'pro'`).get().c,
      ultraUsers: db.prepare(`SELECT COUNT(*) as c FROM users WHERE plan = 'ultra'`).get().c,
      bannedUsers: db.prepare('SELECT COUNT(*) as c FROM users WHERE is_banned = 1').get().c,
      pageviewsToday: db.prepare(`SELECT pageviews FROM analytics WHERE date = date('now')`).get()?.pageviews || 0,
      visitorsToday: db.prepare(`SELECT visitors FROM analytics WHERE date = date('now')`).get()?.visitors || 0,
    };

    const recentUsers = db.prepare('SELECT id, name, email, plan, role, is_banned, created_at FROM users ORDER BY created_at DESC LIMIT 10').all();
    const recentPayments = db.prepare(`
      SELECT p.*, u.name, u.email FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 10
    `).all();
    const recentTickets = db.prepare(`
      SELECT t.*, u.name, u.email FROM tickets t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC LIMIT 10
    `).all();

    return Response.json({ stats, recentUsers, recentPayments, recentTickets });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
