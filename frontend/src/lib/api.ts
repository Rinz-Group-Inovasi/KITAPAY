import { createClientBrowser } from '@/lib/supabase/client';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
export const BOT_API_BASE_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3005/api/bot';
export const LIVE_MERCHANT_ID = '34df3bc6-371a-4505-ac7e-85376a1f2dca';
export const SANDBOX_MERCHANT_ID = '253f3e50-7af3-4c64-a60d-6ea55d2c6160';

export const fetcher = (url: string) => fetch(url).then(res => res.json());

export function getEnv(): 'sandbox' | 'live' {
  if (typeof document !== 'undefined') {
    return document.cookie.includes('kitapay_env=sandbox') ? 'sandbox' : 'live';
  }
  return 'live';
}

export function getClientMerchantId(liveUserId?: string) {
  return liveUserId || '';
}

export interface CreatePaymentParams {
  merchantId: string;
  amount: number;
  customerEmail: string;
  customerWhatsapp: string;
  paymentMethod: string;
  chargeFeeToCustomer?: boolean;
}

export interface RequestPayoutParams {
  merchantId: string;
  amount: number;
  payoutType: 'SCHEDULED_FREE' | 'INSTANT_PAID';
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export async function createPayment(params: CreatePaymentParams) {
  const env = getEnv();
  const res = await fetch(`${API_BASE_URL}/payments/create?env=${env}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create payment');
  }
  return res.json();
}

export async function requestPayout(params: RequestPayoutParams) {
  const env = getEnv();
  const res = await fetch(`${API_BASE_URL}/payouts/request?env=${env}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to request payout');
  }
  return res.json();
}

export async function getPayment(id: string) {
  const env = getEnv();
  const res = await fetch(`${API_BASE_URL}/payments/${id}?env=${env}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to get payment');
  }
  return res.json();
}

export async function simulatePayment(id: string) {
  const env = getEnv();
  const supabase = createClientBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: any = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE_URL}/payments/${id}/simulate?env=${env}`, {
    method: 'POST',
    headers: headers,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to simulate payment');
  }
  return res.json();
}

