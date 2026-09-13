import { Sidebar } from '@/components/Sidebar';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { SANDBOX_MERCHANT_ID } from '@/lib/api';
import { cookies } from 'next/headers';
import { Topbar } from '@/components/Topbar';
import { createClientServer } from '@/lib/supabase/server';
import { AuthProvider } from '@/components/AuthProvider';
import { EnvProvider } from '@/components/EnvProvider';
import { redirect } from 'next/navigation';
import ProfileOnboarding from '@/components/ProfileOnboarding';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseServer = await createClientServer();
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const admin = getSupabaseAdmin();

  // 1. Fetch real user's profile to get KYC status
  const { data: realUserMerchant } = await admin
    .from('merchants')
    .select('verification_status, business_name')
    .eq('id', user.id)
    .single();

  const kycStatus = realUserMerchant?.verification_status || 'UNVERIFIED';

  // 2. Enforce Sandbox if KYC is not VERIFIED
  let isSandbox = cookieStore.get('kitapay_env')?.value === 'sandbox';
  if (kycStatus !== 'VERIFIED') {
    isSandbox = true;
  }

  const merchantId = user.id;

  // 3. Fetch data for the active merchant (could be Sandbox or Live)
  const { data: activeMerchant } = await admin
    .from('merchants')
    .select('available_balance, sandbox_balance, business_name')
    .eq('id', merchantId)
    .single();

  const balance = isSandbox ? (activeMerchant?.sandbox_balance || 0) : (activeMerchant?.available_balance || 0);
  const name = realUserMerchant?.business_name || user.user_metadata?.full_name || 'My Store';

  return (
    <AuthProvider serverUser={user}>
      <EnvProvider isSandbox={isSandbox}>
        <div className="flex min-h-screen bg-slate-50 font-sans">
          <Sidebar isSandbox={isSandbox} />
          <div className="flex-1 flex flex-col min-w-0">
            {isSandbox && (
               <div className="bg-orange-500 text-white text-xs font-bold py-1.5 px-4 text-center shadow-sm w-full">
                  MODE SANDBOX - Data transaksi di bawah ini hanyalah uji coba.
               </div>
            )}
            {/* Top Header */}
            <Topbar initialIsSandbox={isSandbox} kycStatus={kycStatus} defaultName={name} />

            {/* Main Content Area */}
            <main className="flex-1 p-8 relative">
              <ProfileOnboarding />
              <div key={isSandbox ? 'sandbox' : 'live'}>
                {children}
              </div>
            </main>
          </div>
        </div>
      </EnvProvider>
    </AuthProvider>
  );
}
