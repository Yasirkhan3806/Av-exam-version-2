import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Must come from env — no hardcoded fallback, and deliberately not
// NEXT_PUBLIC_-prefixed (this runs in Edge middleware, server-side only).
// Must match backend/.env's JWT_SECRET exactly.
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set. Add it to frontend/.env.local.");
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);


export async function Instructormiddleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('instructorToken')?.value;

    // Allow login page to be accessed without authentication
    if (pathname.startsWith('/Instructor/login')) {
        return NextResponse.next();
    }

    // Build redirects from request.nextUrl, not request.url: behind a reverse
    // proxy (Nginx -> next start) request.url resolves to the internal origin
    // (localhost:<port>), so redirects would send the browser there.
    // request.nextUrl honours the forwarded host/proto.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/Instructor/login';
    loginUrl.search = '';

    // Check if token exists
    if (!token) {
        return NextResponse.redirect(loginUrl);
    }

    try {
        await jwtVerify(token, SECRET, {
            clockTolerance: 120 // 2 minutes tolerance for clock skew
        });
        return NextResponse.next();
    } catch (e) {
        // Token is invalid
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: ['/Instructor/:path*'],
};