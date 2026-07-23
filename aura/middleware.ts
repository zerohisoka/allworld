import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PATHS = [
  "/dashboard",
  "/billing",
  "/settings",
  "/reports",
  "/alerts",
];

const PUBLIC_PATHS = [
  "/reset-password",
  "/forgot-password",
  "/auth/confirm",
  "/auth",
  "/login",
  "/signup",
  "/",
];

const PUBLIC_API_PATHS = ["/api/dodo/webhook", "/api/cron"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth checks for public paths
  if (PUBLIC_PATHS.some((path) => pathname === path)) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  const { supabaseResponse, user } = await updateSession(request);

  // Check if the path is a protected dashboard route
  const isProtectedRoute = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  // Check if it's a protected API route
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicApiRoute = PUBLIC_API_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );
  const isProtectedApiRoute = isApiRoute && !isPublicApiRoute;

  // Redirect unauthenticated users to login
  if (!user && (isProtectedRoute || isProtectedApiRoute)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/dashboard") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
