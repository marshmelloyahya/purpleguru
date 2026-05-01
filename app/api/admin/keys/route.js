import { getDb } from '@/lib/db';
import { getCurrentUser, createSessionsTable } from '@/lib/auth';
import { testApiKey } from '@/lib/ai';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  createSessionsTable();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const keys = db.prepare('SELECT id, provider, key_value, is_active, is_working, daily_usage, total_usage, error_count, last_used_at, notes, created_at FROM api_keys ORDER BY created_at DESC').all();
  // Mask the key for display
  const masked = keys.map(k => ({ ...k, key_value: k.key_value.slice(0, 8) + '••••••••' + k.key_value.slice(-4) }));
  return Response.json({ keys: masked });
}

export async function POST(req) {
  createSessionsTable();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const { provider, key_values, notes } = await req.json();
  if (!provider || !key_values || !key_values.length) return Response.json({ error: 'Provider and keys required' }, { status: 400 });

  const keysArray = Array.isArray(key_values) ? key_values : [key_values];
  let successCount = 0;
  let failCount = 0;

  // We test keys concurrently for faster mass addition
  const testPromises = keysArray.map(async (kv) => {
    const val = kv.trim();
    if (!val) return null;
    const works = await testApiKey(provider, val);
    return { val, works };
  });

  const results = await Promise.all(testPromises);

  const stmt = db.prepare('INSERT INTO api_keys (provider, key_value, is_working, notes, added_by) VALUES (?, ?, ?, ?, ?)');
  
  const insertMany = db.transaction((resArray) => {
    for (const r of resArray) {
      if (r) {
        stmt.run(provider, r.val, r.works ? 1 : 0, notes || null, user.id);
        if (r.works) successCount++;
        else failCount++;
      }
    }
  });

  insertMany(results);

  return Response.json({ 
    success: true, 
    message: `Added ${successCount} working keys and ${failCount} failing keys.`,
    successCount,
    failCount
  });
}

export async function PATCH(req) {
  createSessionsTable();
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 403 });
  const db = getDb();
  const { keyId, action } = await req.json();

  if (action === 'toggle') {
    const key = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(keyId);
    if (!key) return Response.json({ error: 'Key not found' }, { status: 404 });
    db.prepare('UPDATE api_keys SET is_active = ? WHERE id = ?').run(key.is_active ? 0 : 1, keyId);
  } else if (action === 'test') {
    const key = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(keyId);
    if (!key) return Response.json({ error: 'Key not found' }, { status: 404 });
    const works = await testApiKey(key.provider, key.key_value);
    db.prepare('UPDATE api_keys SET is_working = ?, last_tested_at = datetime("now") WHERE id = ?').run(works ? 1 : 0, keyId);
    return Response.json({ success: true, works });
  } else if (action === 'delete') {
    db.prepare('DELETE FROM api_keys WHERE id = ?').run(keyId);
  }

  return Response.json({ success: true });
}
