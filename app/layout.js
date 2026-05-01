import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { GlobalFooter } from '@/components/GlobalFooter';
import { getDb } from '@/lib/db';

export async function generateMetadata() {
  let siteName = 'PurpleGuru';
  let tagline = 'Next-Gen AI Platform';
  let desc = 'Generate text, images, and videos with the power of AI.';
  let keys = 'ai, generator, purpleguru';

  try {
    const db = getDb();
    const res = await db.execute("SELECT key, value FROM settings WHERE key IN ('site_name', 'site_tagline', 'seo_description', 'seo_keywords')");
    const settings = res.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    
    if (settings.site_name) siteName = settings.site_name;
    if (settings.site_tagline) tagline = settings.site_tagline;
    if (settings.seo_description) desc = settings.seo_description;
    if (settings.seo_keywords) keys = settings.seo_keywords;
  } catch (err) {
    console.error('Error fetching metadata:', err);
  }

  return {
    title: `${siteName} – ${tagline}`,
    description: desc,
    keywords: keys,
  };
}

export default async function RootLayout({ children }) {
  let settings = {};
  try {
    const db = getDb();
    const res = await db.execute('SELECT key, value FROM settings');
    settings = res.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  } catch (err) {}

  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#080b14" />
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){var t=localStorage.getItem('aura-theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`
        }} />
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', margin: 0 }}>
        <ThemeProvider>
          <AnalyticsTracker />
          {children}
          <GlobalFooter settings={settings} />
        </ThemeProvider>
      </body>
    </html>
  );
}
