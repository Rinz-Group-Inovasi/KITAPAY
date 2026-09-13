import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');
  const next = searchParams.get('next') ?? '/dashboard';

  if (access_token && refresh_token) {
    const response = NextResponse.redirect(`${origin}${next}`);
    
    const { createServerClient } = await import('@supabase/ssr');
    const { getCookieDomain } = await import('@/lib/domain');
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
          getAll() { return [] },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const secure = hostHeader.includes('localhost') ? false : options.secure;
              response.cookies.set(name, value, { ...options, domain, secure });
            });
          }
        }
      }
    );
    
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token
    });

    if (!error) {
      return response;
    } else {
      console.error('setSession error:', error);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
