import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
];

const publicRoutePatterns = [
  /^\/builds\/[^/]+$/,
  /^\/thread\/[^/]+$/,
  /^\/u\/[^/]+$/,
  /^\/api\/auth(\/.*)?\/?$/,
  /^\/api\/captcha(\/.*)?\/?$/,
  /^\/api\/username-check\/?$/,
];

const adminRoutes = ["/admin"];

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  return publicRoutePatterns.some((pattern) => pattern.test(pathname));
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Admin route protection
  if (isAdminRoute(pathname)) {
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  // All other routes require authentication
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
