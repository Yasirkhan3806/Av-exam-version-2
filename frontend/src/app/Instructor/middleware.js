import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);


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
        await jwtVerify(token, SECRET);
        return NextResponse.next();
    } catch (e) {
        // Token is invalid
        return NextResponse.redirect(new URL('/Instructor/login', request.url));
    }
}

export const config = {
    matcher: ['/Instructor/:path*'],
};