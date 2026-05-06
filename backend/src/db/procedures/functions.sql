-- =============================================================================
-- PL/pgSQL Functions
-- (Functions, not procedures — so they can be called from triggers and queries)
-- =============================================================================

-- ============================================================
-- Function: calculate_carbon_credits
-- Converts energy_kwh to carbon credits (1 MWh = 1 credit; 1 kWh = 0.001)
-- Raises LOG_NOT_FOUND if the production log does not exist
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_carbon_credits(p_log_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql AS $$
DECLARE
    v_energy_kwh NUMERIC;
BEGIN
    SELECT energy_kwh
    INTO   v_energy_kwh
    FROM   ProductionLog
    WHERE  log_id = p_log_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LOG_NOT_FOUND: Production log % does not exist', p_log_id
            USING ERRCODE = 'P0001';
    END IF;

    -- 1 MWh = 1 carbon credit => 1 kWh = 0.001 credits
    RETURN ROUND(v_energy_kwh * 0.001, 4);
END;
$$;

-- ============================================================
-- Function: get_company_wallet_balance
-- Returns the CreditWallet.balance for a given company
-- Raises WALLET_NOT_FOUND if no wallet record exists
-- ============================================================
CREATE OR REPLACE FUNCTION get_company_wallet_balance(p_company_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT balance
    INTO   v_balance
    FROM   CreditWallet
    WHERE  company_id = p_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WALLET_NOT_FOUND: No wallet found for company %', p_company_id
            USING ERRCODE = 'P0001';
    END IF;

    RETURN v_balance;
END;
$$;

-- ============================================================
-- Function: calculate_marketplace_fee
-- Returns 2% platform fee for monetary trade reporting
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_marketplace_fee(p_total_amount NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql AS $$
BEGIN
    RETURN ROUND(p_total_amount * 0.02, 4);
END;
$$;

-- ============================================================
-- Function: generate_carbon_credits
-- FUNCTION (not PROCEDURE) so it can be called from triggers.
-- Participates in the caller's transaction — no internal COMMIT.
--
-- Logic:
--   1. Verify the log exists and is in 'Verified' status
--   2. Check for duplicate credit issuance (log_id UNIQUE enforced at DB level
--      AND here explicitly for a clear exception message)
--   3. Calculate credits via calculate_carbon_credits()
--   4. INSERT into CarbonCredit
--   5. UPDATE CreditWallet (add issued credits)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_carbon_credits(p_log_id INT)
RETURNS VOID
LANGUAGE plpgsql AS $$
DECLARE
    v_verification_status   VARCHAR(20);
    v_company_id            INT;
    v_credits               NUMERIC;
    v_existing_credit_id    INT;
BEGIN
    -- Step 1: Fetch log status and owning company via plant
    SELECT pl.verification_status, ep.company_id
    INTO   v_verification_status, v_company_id
    FROM   ProductionLog pl
    JOIN   EnergyPlant   ep ON pl.plant_id = ep.plant_id
    WHERE  pl.log_id = p_log_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LOG_NOT_FOUND: Production log % does not exist', p_log_id
            USING ERRCODE = 'P0001';
    END IF;

    IF v_verification_status <> 'Verified' THEN
        RAISE EXCEPTION 'LOG_NOT_VERIFIED: Production log % has status %, must be Verified',
            p_log_id, v_verification_status
            USING ERRCODE = 'P0001';
    END IF;

    -- Step 2: Guard against duplicate issuance
    SELECT credit_id
    INTO   v_existing_credit_id
    FROM   CarbonCredit
    WHERE  log_id = p_log_id;

    IF FOUND THEN
        RAISE EXCEPTION 'DUPLICATE_CREDIT_ISSUANCE: Carbon credits already issued for log %', p_log_id
            USING ERRCODE = 'P0001';
    END IF;

    -- Step 3: Calculate credit amount
    v_credits := calculate_carbon_credits(p_log_id);

    -- Step 4: Insert carbon credit record
    INSERT INTO CarbonCredit (company_id, log_id, credits_issued)
    VALUES (v_company_id, p_log_id, v_credits);

    -- Step 5: Update or create wallet balance
    UPDATE CreditWallet
    SET    balance      = balance + v_credits,
           last_updated = CURRENT_TIMESTAMP
    WHERE  company_id   = v_company_id;

    IF NOT FOUND THEN
        -- Fallback: create wallet if trigger somehow missed it
        INSERT INTO CreditWallet (company_id, balance)
        VALUES (v_company_id, v_credits);
    END IF;
END;
$$;
