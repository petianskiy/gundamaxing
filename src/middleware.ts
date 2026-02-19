import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight middleware — no Prisma/NextAuth imports to stay under 1MB Edge limit.
// We check for session cookie existence only. Role-based access is enforced in layouts.

const publicRoutes = [
  "/",
  "/builds",
  "/forum",
  "/faq",
  "/guidelines",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/verify-email-change",
  "/complete-profile",
];

const publicRoutePatterns = [
  /^\/builds\/[^/]+$/,
  /^\/thread\/[^/]+$/,
  /^\/u\/[^/]+$/,
  /^\/hangar\/[^/]+$/,
  /^\/api\//,
];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) {
    return true;
  }
  return publicRoutePatterns.some((pattern) => pattern.test(pathname));
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth JWT or database session)
  const sessionCookie =
    req.cookies.get("authjs.session-token") ||
    req.cookies.get("__Secure-authjs.session-token") ||
    req.cookies.get("next-auth.session-token") ||
    req.cookies.get("__Secure-next-auth.session-token");

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|mov|mp3|ogg|woff2?|ttf|eot)$).*)",
  ],
};
