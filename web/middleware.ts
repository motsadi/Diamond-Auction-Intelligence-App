import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Some browsers request `/favicon.ico` automatically even if the app serves `/icon.svg`.
  if (request.nextUrl.pathname === '/favicon.ico') {
    const url = request.nextUrl.clone();
    url.pathname = '/icon.svg';
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/favicon.ico'],
};


