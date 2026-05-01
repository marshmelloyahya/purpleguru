import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { testApiKey } from '@/lib/ai';

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const db = getDb();
    const keys = db.prepare('SELECT id, provider, key_value FROM api_keys').all();

    const updateStmt = db.prepare('UPDATE api_keys SET is_working = ?, last_tested_at = datetime("now"), error_msg = ? WHERE id = ?');

    const checkPromises = keys.map(async (key) => {
      let isWorking = 1;
      let errorMsg = null;
      try {
        const works = await testApiKey(key.provider, key.key_value);
        if (!works) {
          isWorking = 0;
          errorMsg = 'API rejected key';
        }
      } catch (e) {
        isWorking = 0;
        errorMsg = e.message;
      }
      return { id: key.id, isWorking, errorMsg };
    });

    const results = await Promise.all(checkPromises);

    const updateMany = db.transaction((resArray) => {
      for (const r of resArray) {
        updateStmt.run(r.isWorking, r.errorMsg, r.id);
      }
    });

    updateMany(results);

    return Response.json({ success: true, message: `Checked ${keys.length} keys.` });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
