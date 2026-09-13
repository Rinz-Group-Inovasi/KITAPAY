import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getCookieDomain } from '@/lib/domain';

export async function createClientServer() {
  const cookieStore = await cookies();
  const host = (await headers()).get('host') || '';
  const domain = getCookieDomain(host);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { 
        domain,
        secure: host.includes('localhost') || host.includes('127.0.0.1') ? false : true 
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const secure = host.includes('localhost') || host.includes('127.0.0.1') ? false : options.secure;
              cookieStore.set(name, value, { ...options, domain, secure });
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
