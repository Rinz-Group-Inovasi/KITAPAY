import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/server-middleware';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  let hostname = request.headers.get('host') || '';
  hostname = hostname.replace(/:\d+$/, ''); // remove port for local dev
  const path = url.pathname;

  let baseResponse = NextResponse.next({ request });
  let isAppSubdomain = hostname.startsWith('app.');
  
  const hostHeader = request.headers.get('host') || '';

  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  const isPreviewDomain = hostname.includes('netlify.app') || hostname.includes('railway.app');

  // STRICT LOCALHOST NORMALIZATION:
  // Browsers drop cross-subdomain cookies on localhost. 
  // We force everything to run on the root localhost domain to avoid PKCE and session loss.
  if (isLocalhost && (hostname.startsWith('login.') || hostname.startsWith('app.'))) {
    const newUrl = new URL(request.url);
    newUrl.host = hostHeader.replace('login.', '').replace('app.', '');
    // If it was the root of login subdomain, it should map to /login on main domain
    if (path === '/' && hostname.startsWith('login.') && !url.searchParams.has('code')) {
      newUrl.pathname = '/login';
    }
    return NextResponse.redirect(newUrl);
  }

  // Intercept OAuth callback redirect from Supabase that falls back to root or login domain
  if (path === '/' && url.searchParams.has('code')) {
    const newUrl = new URL(request.url);
    if (!isLocalhost && !isPreviewDomain && !hostname.startsWith('login.')) {
      // In production, force it to the login subdomain where the PKCE cookie was set
      newUrl.host = `login.${hostHeader.replace('app.', '')}`;
    }
    newUrl.pathname = '/auth/callback';
    return NextResponse.redirect(newUrl);
  }

  // Redirect main domain -> subdomains
  const isMainDomain = !hostname.startsWith('app.') && !hostname.startsWith('login.') && !hostname.startsWith('api.');

  if (isMainDomain && !isLocalhost && !isPreviewDomain) {
    if (path.startsWith('/dashboard')) {
      const newUrl = new URL(request.url);
      newUrl.host = `app.${hostHeader}`;
      newUrl.pathname = path.replace('/dashboard', '') || '/';
      return NextResponse.redirect(newUrl);
    }
    if (path.startsWith('/login') || path.startsWith('/auth')) {
      const newUrl = new URL(request.url);
      newUrl.host = `login.${hostHeader}`;
      if (path.startsWith('/login')) {
        newUrl.pathname = path.replace('/login', '') || '/';
      }
      return NextResponse.redirect(newUrl);
    }
  }

  // Subdomain APP
  if (isAppSubdomain) {
    // Redirect public pages from app subdomain back to the main domain
    if (path.startsWith('/docs') || path.startsWith('/pricing') || path.startsWith('/privacy-policy') || path.startsWith('/terms-of-service')) {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const mainDomain = hostHeader.replace('app.', '');
      const redirUrl = `${protocol}://${mainDomain}${path}`;
      
      return NextResponse.redirect(redirUrl);
    }

    if (!path.startsWith('/dashboard') && !path.startsWith('/auth') && !path.startsWith('/snap')) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/dashboard${path === '/' ? '' : path}`;
      baseResponse = NextResponse.rewrite(rewriteUrl);
    }
  } 
  // Subdomain LOGIN
  else if (hostname.startsWith('login.') && !path.startsWith('/login') && !path.startsWith('/auth')) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/login${path === '/' ? '' : path}`;
    baseResponse = NextResponse.rewrite(rewriteUrl);
  }

  // Pass to Supabase for auth checks
  return await updateSession(request, baseResponse, isAppSubdomain);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|js)$).*)',
  ],
};
