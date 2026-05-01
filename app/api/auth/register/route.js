import { createSessionsTable, registerUser } from '@/lib/auth';

export async function POST(req) {
  try {
    createSessionsTable();
    const { name, email, password } = await req.json();
    if (!name || !email || !password) return Response.json({ error: 'All fields required' }, { status: 400 });
    if (password.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    const user = await registerUser({ name, email, password });
    return Response.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
