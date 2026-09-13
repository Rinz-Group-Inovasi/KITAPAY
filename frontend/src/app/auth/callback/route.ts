import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClientServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('exchangeCodeForSession error:', error);
    }
    
    if (!error && data.user) {
      // Auto-register merchant if not exists
      const admin = getSupabaseAdmin();
      const { data: existingMerchant } = await admin
        .from('merchants')
        .select('id')
        .eq('id', data.user.id)
        .single();
        
      // Redirect to the APP subdomain instead of staying on LOGIN
      const hostHeader = request.headers.get('host') || new URL(request.url).host;
      let targetHost = hostHeader;
      if (targetHost.startsWith('login.')) {
        targetHost = targetHost.replace('login.', 'app.');
      }
      const protocol = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
      
      const isAppTarget = targetHost.startsWith('app.');
      // Since app subdomain maps '/' to dashboard, we can just go to '/'
      const targetPath = (next === '/dashboard' && isAppTarget) ? '/' : next;
      
      let response: NextResponse;
      
      // If we are redirecting to a different subdomain (e.g. login.localhost -> app.localhost)
      // We must pass the session tokens via URL because cookies cannot be shared on localhost without a dot
      if (targetHost !== hostHeader) {
        // We use a special route /auth/set-session to set the cookies on the target subdomain
        const sessionUrl = new URL(`${protocol}://${targetHost}/auth/set-session`);
        sessionUrl.searchParams.set('access_token', data.session.access_token);
        sessionUrl.searchParams.set('refresh_token', data.session.refresh_token);
        sessionUrl.searchParams.set('next', targetPath);
        response = NextResponse.redirect(sessionUrl);
      } else {
        response = NextResponse.redirect(`${protocol}://${targetHost}${targetPath}`);      
      }
      
      if (!existingMerchant) {
        await admin.from('merchants').insert({
          id: data.user.id,
          business_name: data.user.user_metadata?.full_name || 'My Business',
          email: data.user.email || '',
          available_balance: 0,
          status: 'PENDING'
        });
        
        // Force sandbox for new merchants
        response.cookies.set('kitapay_env', 'sandbox', { path: '/', maxAge: 31536000 });
      }

      return response;
    }
  }

  // return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}
