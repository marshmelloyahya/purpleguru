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
  const session = db.prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')").get(sessionToken);
  if (!session) return null;

  const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_banned = 0').get(session.user_id);
  return user || null;
}

export async function getGuestSession() {
  const cookieStore = await cookies();
  return cookieStore.get('guest_session')?.value;
}

export function checkAndResetDailyUsage(user) {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  if (user.last_reset_date !== today) {
    db.prepare(`UPDATE users SET daily_text_used = 0, daily_image_used = 0, daily_video_used = 0, last_reset_date = ? WHERE id = ?`).run(today, user.id);
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
  const limitField = `${type}`;
  return (user ? user[field] : 0) < limits[limitField];
}

export async function registerUser({ name, email, password }) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 10);
  const uuid = uuidv4();
  const result = db.prepare(`INSERT INTO users (uuid, name, email, password_hash, role, plan, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(uuid, name, email, hash, 'user', 'free', 1);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

export async function loginUser({ email, password }) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw new Error('Invalid credentials');
  if (user.is_banned) throw new Error('Account suspended');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid credentials');

  // Create session
  const token = uuidv4() + uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);

  return { user, token };
}

export function createSessionsTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}
