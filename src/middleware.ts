import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isLoginPage = req.nextUrl.pathname.startsWith("/auth/signin");

  // 1. ALWAYS ALLOW API AUTH ROUTES (Prevents the "Bounce" bug)
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // 2. If trying to access Dashboard but not logged in -> Redirect to Signin
  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }

  // 3. If already logged in but trying to access Login page -> Redirect to Dashboard
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};