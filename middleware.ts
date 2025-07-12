// middleware.ts

import { NextResponse } from 'next/server'; // <-- kerakli import
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|fonts|images|assets).*)"],
};
