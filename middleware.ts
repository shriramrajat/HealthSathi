import { NextRequest, NextResponse } from 'next/server'

// Define protected routes and their required roles
const PROTECTED_ROUTES = {
  '/dashboard/patient': 'patient',
  '/dashboard/doctor': 'doctor',
  '/dashboard/pharmacy': 'pharmacy',
  '/dashboard/chw': 'chw',
} as const

// Routes that require authentication but no specific role
const AUTH_REQUIRED_ROUTES = ['/dashboard']

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/register', '/about', '/contact']

/**
 * Extract user data from Firebase Auth token
 * This is a simplified version - in production, you'd verify the token with Firebase Admin SDK
 */
async function getUserFromToken(request: NextRequest): Promise<{ uid: string; role?: string } | null> {
  try {
    // Get the Firebase Auth token from cookies or headers
    const authToken = request.cookies.get('__session')?.value || 
                     request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!authToken) {
      return null
    }

    // In a real implementation, you would verify the token with Firebase Admin SDK
    // For now, we'll check if the token exists and try to get user data from localStorage
    // This is handled client-side in the protected route component
    
    // Since middleware runs on the server, we can't access localStorage
    // We'll rely on the client-side protection for role verification
    // The middleware will only check for basic authentication
    
    return { uid: 'authenticated' } // Simplified for middleware
  } catch (error) {
    console.error('Error verifying auth token:', error)
    return null
  }
}

/**
 * Check if a route requires authentication
 */
function requiresAuth(pathname: string): boolean {
  // Check if it's a protected dashboard route
  if (pathname.startsWith('/dashboard')) {
    return true
  }
  
  // Check if it's in the auth required routes
  return AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  })
}

/**
 * Get the expected role for a protected route
 */
function getRequiredRole(pathname: string): string | null {
  for (const [route, role] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return role
    }
  }
  return null
}

/**
 * Redirect to login with return URL
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('returnUrl', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

/**
 * Redirect to appropriate dashboard based on role
 */
function redirectToDashboard(role: string, request: NextRequest): NextResponse {
  const dashboardUrl = new URL(`/dashboard/${role}`, request.url)
  return NextResponse.redirect(dashboardUrl)
}

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  if (requiresAuth(pathname)) {
    const user = await getUserFromToken(request)
    
    // Redirect to login if not authenticated
    if (!user) {
      return redirectToLogin(request)
    }

    // For dashboard routes, we'll let the client-side component handle role verification
    // since we can't easily verify the user's role in middleware without Firebase Admin SDK
    
    // If user is accessing /dashboard (root), let it through to our redirect component
    // The component will handle role-based redirection client-side
  }

  // Continue to the requested page
  return NextResponse.next()
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}