import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie
  const token = request.cookies.get('token')?.value
  
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/file']
  
  // Define auth routes (should redirect to dashboard if already logged in)
  const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // If trying to access protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
  
  // If trying to access auth routes with token, redirect to dashboard
  if (isAuthRoute && token) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/file/:path*',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
  ]
}
