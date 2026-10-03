-- Supabase Schema for Kitapay

-- 1. Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(50),
    verification_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VERIFIED
    available_balance DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    external_id VARCHAR(255) UNIQUE, -- ID from Pakasir
    amount DECIMAL(15, 2) NOT NULL,
    base_fee DECIMAL(15, 2) NOT NULL, -- Pakasir Fee
    kitapay_fee DECIMAL(15, 2) NOT NULL, -- Kitapay Margin Fee
    total_deduction DECIMAL(15, 2) NOT NULL, -- Base + Kitapay Fee
    net_amount DECIMAL(15, 2) NOT NULL, -- Amount - Total Deduction
    payment_method VARCHAR(100) DEFAULT 'QRIS',
    qris_string TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, EXPIRED, FAILED
    customer_email VARCHAR(255),
    customer_whatsapp VARCHAR(50),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Payouts Table
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    external_payout_id VARCHAR(255), -- ID from Pakasir
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) NOT NULL,
    net_payout DECIMAL(15, 2) NOT NULL,
    payout_type VARCHAR(50) NOT NULL, -- SCHEDULED_FREE, INSTANT_PAID
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    bank_code VARCHAR(100),
    account_number VARCHAR(100),
    account_name VARCHAR(255),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_payouts_merchant_id ON payouts(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- 4. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default admin should be claimed via the application setup flow

-- 5. Merchant Requests Table (KYC & Profile Edits)
CREATE TABLE IF NOT EXISTS merchant_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- 'KYC' or 'PROFILE_EDIT'
    payload JSONB NOT NULL, -- stores cloudinary URLs or new profile data
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    notes TEXT, -- optional rejection reason
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_requests_merchant_id ON merchant_requests(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_requests_status ON merchant_requests(status);

-- Add webhook_url to merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS webhook_url VARCHAR(255);

-- 6. Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INT,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_merchant_id ON webhook_logs(merchant_id);
