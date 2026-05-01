import { getDb } from '@/lib/db';
import { loginUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });

    const { user, token } = await loginUser({ email, password });
    const cookieStore = await cookies();
    cookieStore.set('session_token', token, {
      httpOnly: true, secure: true, sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, path: '/',
    });

    return Response.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 401 });
  }
}
