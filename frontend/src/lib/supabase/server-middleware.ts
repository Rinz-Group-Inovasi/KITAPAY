import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getCookieDomain } from '@/lib/domain';

export async function updateSession(request: NextRequest, baseResponse: NextResponse = NextResponse.next({ request }), isAppSubdomain: boolean = false) {
  let supabaseResponse = baseResponse;

  const hostHeader = request.headers.get('host') || '';
  const domain = getCookieDomain(hostHeader);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { 
        domain,
        secure: hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1') ? false : true
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          // DO NOT re-assign supabaseResponse to NextResponse.next() because we will lose our rewrites!
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, domain, secure: hostHeader.includes('localhost') ? false : options.secure })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtectedPath = path.startsWith('/dashboard') || isAppSubdomain;
  const isAuthPath = path.startsWith('/login') || path.startsWith('/auth');

  if (!user && !isAuthPath && isProtectedPath) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    
    // If it's a subdomain environment, redirect to login subdomain
    const hostHeader = request.headers.get('host') || '';
    if (hostHeader.startsWith('app.')) {
      url.host = hostHeader.replace('app.', 'login.');
      url.pathname = '/';
    } else {
      url.pathname = '/login';
    }
    
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
