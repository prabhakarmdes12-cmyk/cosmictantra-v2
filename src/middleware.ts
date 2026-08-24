import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  // Subdomain routing support for cosmictantra.chiti.tech or cosmictantra.localhost
  if (host.startsWith('cosmictantra.') || host.startsWith('astroguruji.')) {
    if (url.pathname === '/') {
      url.pathname = '/';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
