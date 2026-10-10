import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginRoute = req.nextUrl.pathname === "/login";

  // 1. If user is logged in and tries to go to /login, redirect to /dashboard
  if (isLoggedIn && isLoginRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. If user is NOT logged in and tries to go to a protected route, redirect to /login
  if (!isLoggedIn && !isLoginRoute && !req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Otherwise, let the request through
  return NextResponse.next();
});

// IMPORTANT: This matcher ensures middleware only runs on specific paths
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};