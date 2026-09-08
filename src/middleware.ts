import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session_token")?.value;

  const isAuthPage = pathname.startsWith("/login");
  const isPublicApi =
    pathname.startsWith("/api/submissions") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout");

  if (isPublicApi) {
    return NextResponse.next();
  }

  const isAuthenticated = !!token && token.trim().length > 0;

  // If user is trying to access login page while already authenticated -> redirect to /
  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // If user is not authenticated and trying to access protected routes -> redirect to /login
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
