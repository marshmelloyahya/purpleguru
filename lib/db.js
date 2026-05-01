import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

let client;

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initializeSchema() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      plan TEXT NOT NULL DEFAULT 'free',
      plan_expires_at TEXT,
      is_banned INTEGER NOT NULL DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0,
      daily_text_used INTEGER NOT NULL DEFAULT 0,
      daily_image_used INTEGER NOT NULL DEFAULT 0,
      daily_video_used INTEGER NOT NULL DEFAULT 0,
      last_reset_date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      price_monthly REAL NOT NULL DEFAULT 0,
      price_yearly REAL NOT NULL DEFAULT 0,
      daily_text_limit INTEGER NOT NULL DEFAULT 5,
      daily_image_limit INTEGER NOT NULL DEFAULT 2,
      daily_video_limit INTEGER NOT NULL DEFAULT 0,
      features TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      stripe_price_id_monthly TEXT,
      stripe_price_id_yearly TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      key_value TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_working INTEGER NOT NULL DEFAULT 1,
      last_tested_at TEXT,
      daily_usage INTEGER NOT NULL DEFAULT 0,
      total_usage INTEGER NOT NULL DEFAULT 0,
      last_used_at TEXT,
      error_count INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      added_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      guest_session_id TEXT,
      title TEXT NOT NULL DEFAULT 'New Chat',
      type TEXT NOT NULL DEFAULT 'text',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      media_url TEXT,
      model_used TEXT,
      tokens_used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      guest_email TEXT,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'normal',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER,
      is_admin INTEGER NOT NULL DEFAULT 0,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      billing_period TEXT NOT NULL DEFAULT 'monthly',
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT,
      stripe_payment_intent TEXT,
      payment_method TEXT,
      proof_url TEXT,
      sender_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      details TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      guest_session_id TEXT,
      type TEXT NOT NULL,
      model TEXT,
      api_key_id INTEGER,
      tokens_used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      visitors INTEGER DEFAULT 0,
      pageviews INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default plans
  const plansCount = await db.execute('SELECT COUNT(*) as c FROM plans');
  if (plansCount.rows[0].c === 0) {
    await db.execute({ sql: `INSERT OR IGNORE INTO plans (name, slug, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: ['Guest', 'guest', 0, 0, 3, 1, 0, JSON.stringify(['3 text generations/day', '1 image/day', 'Basic models only'])] });
    await db.execute({ sql: `INSERT OR IGNORE INTO plans (name, slug, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: ['Free', 'free', 0, 0, 20, 5, 1, JSON.stringify(['20 text generations/day', '5 images/day', '1 video/day', 'Standard models', 'Conversation history'])] });
    await db.execute({ sql: `INSERT OR IGNORE INTO plans (name, slug, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: ['Pro', 'pro', 9.99, 99.99, 500, 100, 20, JSON.stringify(['500 text/day', '100 images/day', '20 videos/day', 'All premium models', 'Priority queue', 'API access'])] });
    await db.execute({ sql: `INSERT OR IGNORE INTO plans (name, slug, price_monthly, price_yearly, daily_text_limit, daily_image_limit, daily_video_limit, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: ['Ultra', 'ultra', 29.99, 299.99, 9999, 500, 100, JSON.stringify(['Unlimited text', '500 images/day', '100 videos/day', 'All models + early access', 'Priority support', 'API access', 'Custom AI personas'])] });
  }

  // Seed admin user
  const adminCount = await db.execute({ sql: 'SELECT COUNT(*) as c FROM users WHERE role = ?', args: ['admin'] });
  if (adminCount.rows[0].c === 0) {
    const hash = await bcrypt.hash('Admin@123', 10);
    await db.execute({ sql: `INSERT OR IGNORE INTO users (uuid, name, email, password_hash, role, plan, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)`, args: [uuidv4(), 'Admin', 'admin@aura.ai', hash, 'admin', 'ultra', 1] });
  }

  // Seed default settings
  const defaults = [
    ['site_name', 'PurpleGuru'],
    ['site_tagline', 'The Future of AI Generation'],
    ['seo_description', 'Generate stunning text, images, and videos in seconds.'],
    ['seo_keywords', 'ai, chat, generator, images, video'],
    ['guest_enabled', '1'],
    ['registration_enabled', '1'],
    ['stripe_enabled', '0'],
    ['stripe_public_key', ''],
    ['stripe_secret_key', ''],
    ['binance_enabled', '0'],
    ['binance_pay_id', ''],
    ['maintenance_mode', '0'],
  ];
  for (const [k, v] of defaults) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', args: [k, v] });
  }
}
