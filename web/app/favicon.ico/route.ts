import { NextRequest } from 'next/server';

// Chrome will often request `/favicon.ico` even if the app uses `app/icon.svg`.
// Provide a small redirect to avoid noisy 404s in the console.
export function GET(request: NextRequest) {
  return Response.redirect(new URL('/icon.svg', request.url), 307);
}


