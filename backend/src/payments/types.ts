export interface PaymentRequest {
    merchantId: string;
    amount: number;
    customerEmail: string;
    customerWhatsapp: string;
    paymentMethod: string;
    referenceId?: string;
    chargeFeeToCustomer?: boolean;
}

export interface PaymentResponse {
    success: boolean;
    transactionId: string;
    externalId?: string;
    qrisString?: string;
    checkoutUrl?: string;
    amount: number;
    totalDeduction: number;
    netAmount: number;
    expiresAt: string;
    error?: string;
}

export interface PayoutRequest {
    merchantId: string;
    amount: number;
    payoutType: 'SCHEDULED_FREE' | 'INSTANT_PAID';
    bankCode: string;
    accountNumber: string;
    accountName: string;
}

export interface PayoutResponse {
    success: boolean;
    payoutId: string;
    externalPayoutId?: string;
    amount: number;
    fee: number;
    netPayout: number;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    error?: string;
}

export interface IPaymentProvider {
    createPayment(request: PaymentRequest): Promise<PaymentResponse>;
    requestPayout(request: PayoutRequest): Promise<PayoutResponse>;
    verifyWebhookSignature(payload: any, signature: string): boolean;
}
