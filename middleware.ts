import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("__session")?.value;
  const isLoggedIn = !!sessionCookie;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isInviteApi = pathname.startsWith("/api/invites");

  if (isApiAuth || isInviteApi) return NextResponse.next();
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/calendar", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
