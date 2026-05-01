import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (token) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    cookieStore.delete('session_token');
  }
  return Response.json({ success: true });
}
