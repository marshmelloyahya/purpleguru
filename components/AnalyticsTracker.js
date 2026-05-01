'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Check if new visitor for this session
    const isNew = !sessionStorage.getItem('aura-visited');
    if (isNew) {
      sessionStorage.setItem('aura-visited', '1');
    }

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newVisitor: isNew })
    }).catch(() => {});
  }, [pathname]);

  return null;
}
