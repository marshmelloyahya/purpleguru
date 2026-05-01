import { initializeSchema } from '@/lib/db';

export async function GET() {
  try {
    await initializeSchema();
    return Response.json({ success: true, message: 'Database initialized successfully.' });
  } catch (err) {
    console.error('[DB Init Error]', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
