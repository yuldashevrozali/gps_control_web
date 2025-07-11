// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get('loggedIn')?.value === 'true';
  const { pathname } = request.nextUrl;

  // If the user is not logged in and tries to access /dashboard, redirect to /login
  if (!isLoggedIn && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is logged in and tries to access /login, redirect to /dashboard
  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next(); // Continue to the requested page
}

// Specify the paths where the middleware should run
export const config = {
  matcher: ['/dashboard/:path*', '/login'], // Protect /dashboard and its sub-paths, and handle /login
};