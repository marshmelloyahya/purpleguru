import { cookies } from 'next/headers';
import { getDb } from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const PLAN_LIMITS = {
  guest: { text: 3, image: 1, video: 0 },
  free: { text: 20, image: 5, video: 1 },
  pro: { text: 500, image: 100, video: 20 },
  ultra: { text: 9999, image: 500, video: 100 },
};

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;
  if (!sessionToken) return null;

  const db = getDb();
  const sessionRes = await db.execute({
    sql: "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')",
    args: [sessionToken],
  });
  const session = sessionRes.rows[0];
  if (!session) return null;

  const userRes = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ? AND is_banned = 0',
    args: [session.user_id],
  });
  return userRes.rows[0] || null;
}

export async function getGuestSession() {
  const cookieStore = await cookies();
  return cookieStore.get('guest_session')?.value;
}

export async function checkAndResetDailyUsage(user) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  if (user.last_reset_date !== today) {
    await db.execute({
      sql: `UPDATE users SET daily_text_used = 0, daily_image_used = 0, daily_video_used = 0, last_reset_date = ? WHERE id = ?`,
      args: [today, user.id],
    });
    user.daily_text_used = 0;
    user.daily_image_used = 0;
    user.daily_video_used = 0;
  }
  return user;
}

export function canUseFeature(user, type) {
  const plan = user ? user.plan : 'guest';
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.guest;
  const field = `daily_${type}_used`;
  return (user ? user[field] : 0) < limits[type];
}

export async function registerUser({ name, email, password }) {
  const db = getDb();
  const existingRes = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
  if (existingRes.rows[0]) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 10);
  const uuid = uuidv4();
  const result = await db.execute({
    sql: `INSERT INTO users (uuid, name, email, password_hash, role, plan, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [uuid, name, email, hash, 'user', 'free', 1],
  });
  const newUser = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [result.lastInsertRowid] });
  return newUser.rows[0];
}

export async function loginUser({ email, password }) {
  const db = getDb();
  const userRes = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
  const user = userRes.rows[0];
  if (!user) throw new Error('Invalid credentials');
  if (user.is_banned) throw new Error('Account suspended');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  const token = uuidv4() + uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.execute({
    sql: 'INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
    args: [token, user.id, expiresAt],
  });

  return { user, token };
}

// Kept for backward compatibility — schema is now created via initializeSchema()
export async function createSessionsTable() {
  // No-op: sessions table is created in initializeSchema on first API call via /api/init
}
