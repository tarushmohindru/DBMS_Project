-- =============================================================================
-- PL/pgSQL Triggers — All 5 required triggers
-- =============================================================================

-- ============================================================
-- Trigger 1: trg_auto_create_wallet
-- AFTER INSERT ON Company
-- Automatically creates a CreditWallet with balance = 0
-- for every newly registered company.
-- ============================================================
CREATE OR REPLACE FUNCTION trg_auto_create_wallet_fn()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO CreditWallet (company_id, balance)
    VALUES (NEW.company_id, 0)
    ON CONFLICT (company_id) DO NOTHING;  -- Idempotent for reruns
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_wallet ON Company;
CREATE TRIGGER trg_auto_create_wallet
    AFTER INSERT ON Company
    FOR EACH ROW
    EXECUTE FUNCTION trg_auto_create_wallet_fn();

-- ============================================================
-- Trigger 2: trg_prevent_duplicate_credit
-- BEFORE INSERT ON CarbonCredit
-- Second safety layer: raises DUPLICATE_CREDIT_ISSUANCE if a credit
-- record already exists for the same log_id.
-- (Primary check is in generate_carbon_credits(); this is a DB-level guard.)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_prevent_duplicate_credit_fn()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_existing INT;
BEGIN
    SELECT credit_id
    INTO   v_existing
    FROM   CarbonCredit
    WHERE  log_id = NEW.log_id;

    IF FOUND THEN
        RAISE EXCEPTION 'DUPLICATE_CREDIT_ISSUANCE: Carbon credits already exist for production log %',
            NEW.log_id
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_credit ON CarbonCredit;
CREATE TRIGGER trg_prevent_duplicate_credit
    BEFORE INSERT ON CarbonCredit
    FOR EACH ROW
    EXECUTE FUNCTION trg_prevent_duplicate_credit_fn();

-- ============================================================
-- Trigger 3: trg_auto_issue_credits
-- AFTER UPDATE ON ProductionLog
-- When verification_status transitions to 'Verified', automatically
-- calls generate_carbon_credits(). Catches DUPLICATE_CREDIT_ISSUANCE
-- silently (verify_production_log procedure may call it first).
-- ============================================================
CREATE OR REPLACE FUNCTION trg_auto_issue_credits_fn()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    -- Only fire on transition TO 'Verified'
    IF NEW.verification_status = 'Verified'
       AND (OLD.verification_status IS DISTINCT FROM 'Verified') THEN
        BEGIN
            PERFORM generate_carbon_credits(NEW.log_id);
        EXCEPTION
            WHEN OTHERS THEN
                -- Silently ignore duplicate issuance — the procedure may have run first.
                -- All other exceptions are re-raised.
                IF SQLERRM NOT LIKE '%DUPLICATE_CREDIT_ISSUANCE%' THEN
                    RAISE;
                END IF;
        END;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_issue_credits ON ProductionLog;
CREATE TRIGGER trg_auto_issue_credits
    AFTER UPDATE ON ProductionLog
    FOR EACH ROW
    EXECUTE FUNCTION trg_auto_issue_credits_fn();

-- ============================================================
-- Trigger 4: trg_prevent_negative_wallet
-- BEFORE UPDATE ON CreditWallet
-- Prevents wallet balance from going below 0 under any circumstance.
-- Raises INSUFFICIENT_WALLET_BALANCE if new balance would be negative.
-- ============================================================
CREATE OR REPLACE FUNCTION trg_prevent_negative_wallet_fn()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.balance < 0 THEN
        RAISE EXCEPTION
            'INSUFFICIENT_WALLET_BALANCE: Wallet for company % cannot go negative. Attempted balance: %, current: %',
            NEW.company_id, NEW.balance, OLD.balance
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_negative_wallet ON CreditWallet;
CREATE TRIGGER trg_prevent_negative_wallet
    BEFORE UPDATE ON CreditWallet
    FOR EACH ROW
    EXECUTE FUNCTION trg_prevent_negative_wallet_fn();

-- ============================================================
-- Trigger 5: trg_update_wallet_after_transaction
-- AFTER INSERT ON Transaction
-- Post-insert integrity validator: ensures buyer and seller wallets
-- remain non-negative after a transaction is committed.
-- Primary deduction is performed by execute_credit_purchase procedure.
-- This trigger acts as a final-state integrity check (fallback guard).
-- ============================================================
CREATE OR REPLACE FUNCTION trg_update_wallet_after_transaction_fn()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_seller_id      INT;
    v_buyer_balance  NUMERIC;
    v_seller_balance NUMERIC;
BEGIN
    -- Resolve seller from listing
    SELECT seller_id
    INTO   v_seller_id
    FROM   MarketListing
    WHERE  listing_id = NEW.listing_id;

    -- Validate buyer wallet is non-negative
    SELECT balance
    INTO   v_buyer_balance
    FROM   CreditWallet
    WHERE  company_id = NEW.buyer_id;

    IF v_buyer_balance < 0 THEN
        RAISE EXCEPTION
            'INSUFFICIENT_WALLET_BALANCE: Buyer wallet for company % is negative (%) after transaction %',
            NEW.buyer_id, v_buyer_balance, NEW.txn_id
            USING ERRCODE = 'P0001';
    END IF;

    -- Validate seller wallet is non-negative
    SELECT balance
    INTO   v_seller_balance
    FROM   CreditWallet
    WHERE  company_id = v_seller_id;

    IF v_seller_balance < 0 THEN
        RAISE EXCEPTION
            'INSUFFICIENT_WALLET_BALANCE: Seller wallet for company % is negative (%) after transaction %',
            v_seller_id, v_seller_balance, NEW.txn_id
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_wallet_after_transaction ON Transaction;
CREATE TRIGGER trg_update_wallet_after_transaction
    AFTER INSERT ON Transaction
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_wallet_after_transaction_fn();
