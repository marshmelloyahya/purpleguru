import { getDb } from '@/lib/db';
import { testApiKey } from '@/lib/ai';

export async function GET(req) {
  try {
    const db = getDb();
    const settingsRaw = db.prepare('SELECT setting_key, setting_value FROM settings').all();
    const settings = settingsRaw.reduce((acc, row) => ({ ...acc, [row.setting_key]: row.setting_value }), {});

    if (settings.auto_check_keys !== '1') {
      return Response.json({ success: false, message: 'Auto checking is disabled in settings.' });
    }

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

    return Response.json({ success: true, message: `Checked ${keys.length} keys automatically.` });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
