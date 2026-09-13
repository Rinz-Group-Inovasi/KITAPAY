-- ==========================================
-- RPC: simulate_payment_transaction
-- ==========================================
-- Fungsi ini akan memproses pembayaran simulasi secara atomik (ACID transaction).
-- Jika ada satu langkah yang gagal, semua perubahan akan di-rollback.

CREATE OR REPLACE FUNCTION simulate_payment_transaction(
    p_transaction_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Berjalan dengan hak istimewa (bisa bypass RLS untuk update internal)
AS $$
DECLARE
    v_transaction RECORD;
    v_merchant RECORD;
    v_webhook_url TEXT;
    v_response_json JSON;
BEGIN
    -- 1. Ambil data transaksi dengan lock agar tidak ada race condition
    SELECT * INTO v_transaction 
    FROM transactions 
    WHERE id = p_transaction_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Transaction not found');
    END IF;

    IF v_transaction.status = 'COMPLETED' OR v_transaction.status = 'PAID' THEN
        RETURN json_build_object('success', false, 'error', 'Transaction already completed');
    END IF;

    -- 2. Update status transaksi
    UPDATE transactions 
    SET status = 'COMPLETED' 
    WHERE id = p_transaction_id;

    -- 3. Ambil data merchant dengan lock
    SELECT * INTO v_merchant 
    FROM merchants 
    WHERE id = v_transaction.merchant_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Merchant not found');
    END IF;

    -- 4. Tambahkan saldo
    IF v_transaction.is_sandbox THEN
        UPDATE merchants 
        SET sandbox_pending_balance = COALESCE(sandbox_pending_balance, 0) + v_transaction.net_amount 
        WHERE id = v_transaction.merchant_id;
        
        v_webhook_url := v_merchant.sandbox_webhook_url;
    ELSE
        UPDATE merchants 
        SET pending_balance = COALESCE(pending_balance, 0) + v_transaction.net_amount 
        WHERE id = v_transaction.merchant_id;
        
        v_webhook_url := v_merchant.webhook_url;
    END IF;

    -- 5. Kita kembalikan informasi yang dibutuhkan untuk pemanggilan webhook di backend (Node.js)
    -- Kenapa webhook tidak dipanggil di sini? Karena PL/pgSQL tidak bagus untuk melakukan HTTP request (synchronous blocking).
    -- HTTP Call (Webhook) tetap dilakukan di Node.js, tapi mutasi DB sudah dijamin aman di sini.
    
    v_response_json := json_build_object(
        'success', true,
        'transaction', json_build_object(
            'id', v_transaction.id,
            'external_id', v_transaction.external_id,
            'amount', v_transaction.amount,
            'is_sandbox', v_transaction.is_sandbox,
            'merchant_id', v_transaction.merchant_id
        ),
        'target_webhook_url', v_webhook_url
    );

    RETURN v_response_json;
EXCEPTION
    WHEN OTHERS THEN
        -- Rollback otomatis terjadi jika ada error
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
