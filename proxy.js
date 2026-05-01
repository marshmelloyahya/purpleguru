import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  
  // Skip check for the install page, api routes, and static assets
  if (pathname.startsWith('/install') || pathname.startsWith('/api/install') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // If the app is not installed (no .env variable and no cookie), redirect to /install
  if (process.env.APP_INSTALLED !== 'true' && request.cookies.get('aura_installed')?.value !== '1') {
    return NextResponse.redirect(new URL('/install', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
