// middleware.ts

// Hamma narsani comment qilib test qil:
export function middleware(request: any) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api|fonts|images|assets).*)"],
};
