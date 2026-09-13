import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { getCookieDomain } from '@/lib/domain';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// For client-side usage with cookies
export const createClientBrowser = () => createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    domain: typeof window !== 'undefined' ? getCookieDomain(window.location.hostname) : undefined,
    secure: typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')) ? false : true,
  },
});

// Legacy fallback if needed (using memoized browser client to prevent Multiple GoTrueClient instances)
export const supabase = createClientBrowser();

// For server-side administrative tasks (bypassing RLS)
export const getSupabaseAdmin = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseServiceKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Admin client will fail.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};
