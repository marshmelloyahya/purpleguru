import { getCurrentUser, createSessionsTable } from '@/lib/auth';

export async function GET() {
  try {
    createSessionsTable();
    const user = await getCurrentUser();
    if (!user) return Response.json({ user: null });
    return Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, plan: user.plan, daily_text_used: user.daily_text_used, daily_image_used: user.daily_image_used, daily_video_used: user.daily_video_used } });
  } catch {
    return Response.json({ user: null });
  }
}
