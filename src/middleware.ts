import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    //console.log('🔍 MIDDLEWARE HIT:', pathname);

    // Skip middleware for Next.js internals and static files
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // files like favicon.ico, images, etc
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get('auth_token')?.value;
    const isRootOrLogin = pathname === '/' || pathname === '/login';
    const isAdminPage = pathname.startsWith('/admin');

    /*console.log('Middleware check:', {
        path: pathname,
        hasToken: !!token,
        isRootOrLogin
    });*/

    // Protected routes - everything except root and login
    const isProtectedPage = !isRootOrLogin;

    // Redirect to login if accessing protected page without token
    if (isProtectedPage && !token) {
        //console.log('No token, redirecting to /');
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Check admin access
    if (isAdminPage && token) {
        const decoded = verifyToken(token);

        if (!decoded) {
            //console.log('Token verification failed, redirecting to /');
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Check if user is admin
        if (decoded.role !== 'admin') {
            //console.log('Not admin, redirecting to /home');
            return NextResponse.redirect(new URL('/home', request.url));
        }
    }

    // Redirect to home if accessing login with valid token
    if (isRootOrLogin && token && verifyToken(token)) {
        //console.log('Already logged in, redirecting to /home');
        return NextResponse.redirect(new URL('/home', request.url));
    }

    return NextResponse.next();
}

// Simple config - catches all routes
export const config = {
    matcher: '/((?!_next/static|_next/image).*)',
    runtime: 'nodejs'
};