import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const { pathname } = req.nextUrl;

  // 1. Redirect to Login if trying to access dashboard while logged out
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.nextUrl));
  }

  // 2. Redirect logged-in users away from Login/Landing to their dashboard
  if ((pathname === "/" || pathname.startsWith("/auth/signin")) && isLoggedIn) {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    if (role === "KITCHEN") return NextResponse.redirect(new URL("/dashboard/kitchen", req.nextUrl));
    if (role === "BARISTA") return NextResponse.redirect(new URL("/dashboard/barista", req.nextUrl));
    if (role === "CASHIER") return NextResponse.redirect(new URL("/dashboard/cashier", req.nextUrl));
  }

  // 3. ROLE PROTECTION (The Strict Part)
  if (isLoggedIn && pathname.startsWith("/dashboard")) {
    
    // ADMIN: Allowed everywhere.
    if (role === "ADMIN") return NextResponse.next();

    
    const allowedPath = `/dashboard/${role?.toLowerCase()}`;
    
    
    if (!pathname.startsWith(allowedPath)) {
      return NextResponse.redirect(new URL(allowedPath, req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};