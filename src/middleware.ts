import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const isLoginPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/';
    const isAdminPage = request.nextUrl.pathname.startsWith('/admin');


    // Protected routes
    const isProtectedPage =
        request.nextUrl.pathname.startsWith('/buildings') ||
        request.nextUrl.pathname.startsWith('/site-data') ||
        request.nextUrl.pathname.startsWith('/home') ||
        request.nextUrl.pathname.startsWith('/admin');

    // Redirect to login if accessing protected page without token
    if (isProtectedPage && !token) {
        console.log('No token, redirecting to login');
        return NextResponse.redirect(new URL('/', request.url));
    }


    // Redirect to home if accessing login with valid token
    if (isLoginPage && token && verifyToken(token)) {
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/buildings/:path*', '/site-data/:path*', '/admin/:path*', '/login'],
    runtime: 'nodejs'  // Add this line!
};