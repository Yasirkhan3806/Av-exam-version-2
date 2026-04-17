import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || process.env.JWT_SECRET || "08d8d60667a5fceba29530f0de6529ff6ef1aa529c935a579579b63298feeb4c1463a53a4531952c2f2098674bc535f64ef40c523bcb8fa028336239f41e6fa6"
);


export async function Instructormiddleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('instructorToken')?.value;

    // Allow login page to be accessed without authentication
    if (pathname.startsWith('/Instructor/login')) {
        return NextResponse.next();
    }

    // Check if token exists
    if (!token) {
        return NextResponse.redirect(new URL('/Instructor/login', request.url));
    }

    try {
        await jwtVerify(token, SECRET, {
            clockTolerance: 120 // 2 minutes tolerance for clock skew
        });
        return NextResponse.next();
    } catch (e) {
        // Token is invalid
        return NextResponse.redirect(new URL('/Instructor/login', request.url));
    }
}

export const config = {
    matcher: ['/Instructor/:path*'],
};