// middleware.js (create this file in your root directory)
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard'];
  
  const isPathProtected = protectedPaths.some((path) => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPathProtected) {
    if (!session) {
      const url = new URL('/auth/login', req.url);
      url.searchParams.set('callbackUrl', encodeURI(pathname));
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // If the user is authenticated and trying to access auth pages
  if (session && (pathname === '/auth/login' || pathname === '/auth/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

// Configure which paths Middleware will run on
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};