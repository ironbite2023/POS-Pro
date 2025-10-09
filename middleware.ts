import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for middleware
const createSupabaseClient = (request: NextRequest) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      auth: {
        storageKey: 'pos-pro-auth',
        storage: {
          getItem: (key: string) => {
            return request.cookies.get(key)?.value || null;
          },
          setItem: (key: string, value: string) => {
            // Handled by response cookies
          },
          removeItem: (key: string) => {
            // Handled by response cookies
          },
        },
      },
    }
  );
};

// Protected route patterns - all routes requiring authentication
const protectedRoutes = [
  '/dashboard',
  '/(default)',
  '/(pos)',
  '/admin',
  '/settings',
  '/inventory',
  '/menu-management',
  '/loyalty-program',
  '/sales',
  '/purchasing',
  '/delivery',
  '/waste-management',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/auth',
  '/api/auth',
  '/docs',
  '/_next',
  '/images',
  '/favicon.ico',
];

// Check if path matches protected routes
const isProtectedRoute = (pathname: string): boolean => {
  return protectedRoutes.some(route => 
    pathname.startsWith(route) || 
    pathname.match(new RegExp(`^${route.replace('(default)', '.*').replace('(pos)', '.*')}/?`))
  );
};

// Check if path is public
const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some(route => pathname.startsWith(route));
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes and static assets
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Skip middleware for API routes except protected ones
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/protected')) {
    return NextResponse.next();
  }

  // Check if route requires protection
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  try {
    // Create Supabase client for this request
    const supabase = createSupabaseClient(request);
    
    // Get session from request cookies
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      
      return NextResponse.redirect(loginUrl);
    }

    // Validate session is not expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      // Session expired, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      loginUrl.searchParams.set('message', 'Session expired. Please login again.');
      
      return NextResponse.redirect(loginUrl);
    }

    // Session is valid, continue to the route
    const response = NextResponse.next();
    
    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    );
    
    return response;

  } catch (error) {
    console.error('Middleware authentication error:', error);
    
    // On error, redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    loginUrl.searchParams.set('message', 'Authentication error. Please login again.');
    
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
