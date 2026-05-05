import { NextResponse } from "next/server";
import * as jose from "jose"; // ✅ works in Next.js Edge Runtime
import { Instructormiddleware } from "./app/Instructor/middleware";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET || "08d8d60667a5fceba29530f0de6529ff6ef1aa529c935a579579b63298feeb4c1463a53a4531952c2f2098674bc535f64ef40c523bcb8fa028336239f41e6fa6"
);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/Login") ||
    pathname.startsWith("/Admin") ||
    pathname.startsWith("/elibrary") ||
    pathname.includes(".") ||
    pathname.includes("feed")
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
    await jose.jwtVerify(token, JWT_SECRET, {
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
  // Match all paths except structural and static routes
  matcher: [
    "/((?!Admin|elibrary|api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
