import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

    const db = getDb();

    const [totalUsers, activeToday, totalGenerations, generationsToday, totalRevenue, openTickets, apiKeys, proUsers, ultraUsers, bannedUsers, pageviewsToday, visitorsToday, recentUsers, recentPayments, recentTickets] = await Promise.all([
      db.execute({ sql: 'SELECT COUNT(*) as c FROM users WHERE role != ?', args: ['admin'] }),
      db.execute(`SELECT COUNT(DISTINCT user_id) as c FROM usage_logs WHERE date(created_at) = date('now') AND user_id IS NOT NULL`),
      db.execute('SELECT COUNT(*) as c FROM usage_logs'),
      db.execute(`SELECT COUNT(*) as c FROM usage_logs WHERE date(created_at) = date('now')`),
      db.execute(`SELECT COALESCE(SUM(amount),0) as s FROM payments WHERE status = 'completed'`),
      db.execute(`SELECT COUNT(*) as c FROM tickets WHERE status = 'open'`),
      db.execute('SELECT COUNT(*) as c FROM api_keys WHERE is_active = 1 AND is_working = 1'),
      db.execute(`SELECT COUNT(*) as c FROM users WHERE plan = 'pro'`),
      db.execute(`SELECT COUNT(*) as c FROM users WHERE plan = 'ultra'`),
      db.execute('SELECT COUNT(*) as c FROM users WHERE is_banned = 1'),
      db.execute(`SELECT pageviews FROM analytics WHERE date = date('now')`),
      db.execute(`SELECT visitors FROM analytics WHERE date = date('now')`),
      db.execute('SELECT id, name, email, plan, role, is_banned, created_at FROM users ORDER BY created_at DESC LIMIT 10'),
      db.execute(`SELECT p.*, u.name, u.email FROM payments p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 10`),
      db.execute(`SELECT t.*, u.name, u.email FROM tickets t LEFT JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC LIMIT 10`),
    ]);

    const stats = {
      totalUsers: totalUsers.rows[0].c,
      activeToday: activeToday.rows[0].c,
      totalGenerations: totalGenerations.rows[0].c,
      generationsToday: generationsToday.rows[0].c,
      totalRevenue: totalRevenue.rows[0].s,
      openTickets: openTickets.rows[0].c,
      apiKeys: apiKeys.rows[0].c,
      proUsers: proUsers.rows[0].c,
      ultraUsers: ultraUsers.rows[0].c,
      bannedUsers: bannedUsers.rows[0].c,
      pageviewsToday: pageviewsToday.rows[0]?.pageviews || 0,
      visitorsToday: visitorsToday.rows[0]?.visitors || 0,
    };

    return Response.json({ stats, recentUsers: recentUsers.rows, recentPayments: recentPayments.rows, recentTickets: recentTickets.rows });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
