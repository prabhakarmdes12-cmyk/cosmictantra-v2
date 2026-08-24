import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const url = req.nextUrl.clone();

  // Subdomain routing support for cosmictantra.chiti.tech, cosmictantara.chiti.tech, astroguruji.space or localhost
  if (
    host.startsWith('cosmictantra.') ||
    host.startsWith('cosmictantara.') ||
    host.startsWith('astroguruji.') ||
    host.includes('cosmictantra')
  ) {
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
