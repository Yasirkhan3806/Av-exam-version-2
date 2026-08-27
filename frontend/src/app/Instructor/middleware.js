import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { redirectTo } from '../../utils/proxyRedirect';

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

    // Check if token exists
    if (!token) {
        return redirectTo(request, '/Instructor/login');
    }

    try {
        await jwtVerify(token, SECRET, {
            clockTolerance: 120 // 2 minutes tolerance for clock skew
        });
        return NextResponse.next();
    } catch (e) {
        // Token is invalid
        return redirectTo(request, '/Instructor/login');
    }
}

export const config = {
    matcher: ['/Instructor/:path*'],
};