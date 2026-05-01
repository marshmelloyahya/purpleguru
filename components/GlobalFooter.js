'use client';
import Link from 'next/link';

export function GlobalFooter({ settings }) {
  const {
    facebook_url,
    twitter_url,
    instagram_url,
    whatsapp_number,
    telegram_username,
    copyright_text = '© 2026 PurpleGuru. All rights reserved.',
    copyright_link = '#'
  } = settings || {};

  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      padding: '32px 24px',
      marginTop: 'auto',
      textAlign: 'center',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px', fontSize: '20px' }}>
        {facebook_url && <a href={facebook_url} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>FB</a>}
        {twitter_url && <a href={twitter_url} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>X/Twitter</a>}
        {instagram_url && <a href={instagram_url} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>IG</a>}
        {whatsapp_number && <a href={`https://wa.me/${whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>WhatsApp</a>}
        {telegram_username && <a href={`https://t.me/${telegram_username.replace('@', '')}`} target="_blank" rel="noreferrer" style={{color: 'inherit', textDecoration: 'none'}}>Telegram</a>}
      </div>
      <div>
        <Link href={copyright_link} target={copyright_link !== '#' ? '_blank' : '_self'} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}>
          {copyright_text}
        </Link>
      </div>
    </footer>
  );
}
