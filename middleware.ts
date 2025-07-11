// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const loggedIn = request.cookies.get('loggedIn')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Agar foydalanuvchi login bo'lmagan bo'lsa va login sahifasida emas — login sahifasiga yo'naltiramiz
  if (loggedIn !== 'true' && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Agar foydalanuvchi allaqachon login bo'lgan bo'lsa va login sahifasiga urinsa — dashboardga o'tkazamiz
  if (loggedIn === 'true' && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Aks holda davom ettir
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|fonts|images|assets).*)"],
};
