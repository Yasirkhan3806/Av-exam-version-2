import { NextResponse } from "next/server";
import * as jose from "jose"; // ✅ works in Next.js Edge Runtime
import { Instructormiddleware } from "./app/Instructor/middleware";

// Must come from env — no hardcoded fallback, and deliberately not
// NEXT_PUBLIC_-prefixed (this runs in Edge middleware, server-side only; a
// NEXT_PUBLIC_ name would risk the signing secret getting bundled to the
// client). Must match backend/.env's JWT_SECRET exactly.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to frontend/.env.local.");
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Don't apply auth check to login page, admin, instructor, or elibrary routes
  if (
    pathname.startsWith("/Login") ||
    pathname.startsWith("/Admin") ||
    pathname.startsWith("/elibrary")
  ) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/Instructor")) {
    return Instructormiddleware(req);
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/Login", req.url));
  }

  try {
    // ✅ Verify token with jose instead of jsonwebtoken
    const result = await jose.jwtVerify(token, JWT_SECRET, {
      clockTolerance: 120, // 2 minutes tolerance for clock skew between systems
    });
    // Token valid → continue
    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err.code, err.message);
    return NextResponse.redirect(new URL("/Login", req.url));
  }
}

export const config = {
  // Match all paths except those starting with /Admin or /elibrary
  matcher: [
    "/((?!Admin|elibrary|_next/static|_next/image|favicon.ico).*)",
  ],
};
