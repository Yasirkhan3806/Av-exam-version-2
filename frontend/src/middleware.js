import { NextResponse } from "next/server";
import * as jose from "jose"; // ✅ works in Next.js Edge Runtime
import { Instructormiddleware } from "./app/Instructor/middleware";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || "fallback-secret",
);

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
    await jose.jwtVerify(token, JWT_SECRET);

    // Token valid → continue
    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.redirect(new URL("/Login", req.url));
  }
}

export const config = {
  // Match all paths except those starting with /Admin or /elibrary
  matcher: [
    "/((?!Admin|elibrary|_next/static|_next/image|favicon.ico).*)",
  ],
};
