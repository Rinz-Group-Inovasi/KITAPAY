import { IPaymentProvider } from './types';
import { KitaPayProvider } from './KitaPayProvider';
import { DokuProvider } from './doku/DokuProvider';

export * from './types';
export * from './KitaPayProvider';
export * from './doku/DokuProvider';

export function getPaymentProvider(): IPaymentProvider {
    const providerName = (process.env.PAYMENT_GATEWAY_PROVIDER || 'doku').toLowerCase();
    
    if (providerName === 'doku') {
        return new DokuProvider();
    }
    
    // Default fallback to Pakasir (KitaPayProvider)
    return new KitaPayProvider();
}
