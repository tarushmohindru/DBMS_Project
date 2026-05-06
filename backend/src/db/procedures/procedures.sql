-- =============================================================================
-- PL/pgSQL Stored Procedures
-- =============================================================================

-- ============================================================
-- Procedure: verify_production_log
--
-- Verifies or rejects a production log.
-- On 'Verified': calls generate_carbon_credits() (trigger also fires;
--   duplicate is caught silently — first caller wins).
-- Maintains full audit trail in PlantVerificationLog.
-- The caller's statement transaction provides atomicity.
-- ============================================================
CREATE OR REPLACE PROCEDURE verify_production_log(
    p_log_id        INT,
    p_authority_id  INT,
    p_decision      VARCHAR,   -- 'Verified' or 'Rejected'
    p_remarks       TEXT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_plant_id          INT;
    v_current_status    VARCHAR(20);
BEGIN
    -- Validate decision value
    IF p_decision NOT IN ('Verified', 'Rejected') THEN
        RAISE EXCEPTION 'Invalid decision %. Must be Verified or Rejected', p_decision
            USING ERRCODE = 'P0001';
    END IF;

    -- Fetch the production log's current status and associated plant
    SELECT pl.plant_id, pl.verification_status
    INTO   v_plant_id, v_current_status
    FROM   ProductionLog pl
    WHERE  pl.log_id = p_log_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LOG_NOT_FOUND: Production log % does not exist', p_log_id
            USING ERRCODE = 'P0001';
    END IF;

    IF v_current_status <> 'Pending' THEN
        RAISE EXCEPTION 'LOG_NOT_FOUND: Log % is already in status %, cannot re-verify',
            p_log_id, v_current_status
            USING ERRCODE = 'P0001';
    END IF;

    -- Update production log verification status
    -- NOTE: This UPDATE fires trg_auto_issue_credits AFTER UPDATE, which calls
    -- generate_carbon_credits(). The explicit call below catches DUPLICATE_CREDIT_ISSUANCE
    -- if the trigger already ran — both paths are demonstrated as required.
    UPDATE ProductionLog
    SET    verification_status = p_decision
    WHERE  log_id              = p_log_id;

    -- Insert audit record into PlantVerificationLog
    INSERT INTO PlantVerificationLog (plant_id, authority_id, action, remarks)
    VALUES (v_plant_id, p_authority_id, 'LOG_' || p_decision, p_remarks);

    -- Explicitly call generate_carbon_credits if verified
    -- (Trigger handles the same call; if trigger ran first, catch duplicate silently)
    IF p_decision = 'Verified' THEN
        BEGIN
            PERFORM generate_carbon_credits(p_log_id);
        EXCEPTION
            WHEN OTHERS THEN
                -- Only swallow DUPLICATE_CREDIT_ISSUANCE (trigger already ran)
                IF SQLERRM NOT LIKE '%DUPLICATE_CREDIT_ISSUANCE%' THEN
                    RAISE;  -- Re-raise all other exceptions
                END IF;
        END;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'verify_production_log failed: %', SQLERRM
            USING ERRCODE = SQLSTATE;
END;
$$;

-- ============================================================
-- Procedure: execute_credit_purchase
--
-- Atomically executes a carbon credit transfer:
--   - SELECT FOR UPDATE on MarketListing and CreditWallet (row-level locking)
--   - Validates listing active, quantity available, seller ownership, no self-purchase
--   - Inserts Transaction record
--   - Transfers carbon credits from seller wallet to buyer wallet
--   - Records total_amount as monetary/reporting value only
--   - Decrements listing quantity; sets status='Sold' if exhausted
-- ============================================================
CREATE OR REPLACE PROCEDURE execute_credit_purchase(
    p_listing_id    INT,
    p_buyer_id      INT,
    p_quantity      NUMERIC
)
LANGUAGE plpgsql AS $$
DECLARE
    v_listing_status    VARCHAR(20);
    v_listing_quantity  NUMERIC;
    v_seller_id         INT;
    v_price_per_credit  NUMERIC;
    v_total_amount      NUMERIC;
    v_seller_balance    NUMERIC;
    v_new_txn_id        INT;
BEGIN
    -- ---- Acquire row-level lock on MarketListing ----
    SELECT status, quantity, seller_id, price_per_credit
    INTO   v_listing_status, v_listing_quantity, v_seller_id, v_price_per_credit
    FROM   MarketListing
    WHERE  listing_id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LISTING_NOT_ACTIVE: Listing % does not exist', p_listing_id
            USING ERRCODE = 'P0001';
    END IF;

    IF v_listing_status <> 'Active' THEN
        RAISE EXCEPTION 'LISTING_NOT_ACTIVE: Listing % is not active (status: %)',
            p_listing_id, v_listing_status
            USING ERRCODE = 'P0001';
    END IF;

    IF v_listing_quantity < p_quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_QUANTITY: Requested % but only % credits available in listing %',
            p_quantity, v_listing_quantity, p_listing_id
            USING ERRCODE = 'P0001';
    END IF;

    IF v_seller_id = p_buyer_id THEN
        RAISE EXCEPTION 'SELF_PURCHASE_NOT_ALLOWED: Company % cannot purchase its own listing',
            p_buyer_id
            USING ERRCODE = 'P0001';
    END IF;

    -- ---- Calculate monetary reporting amount ----
    v_total_amount   := ROUND(p_quantity * v_price_per_credit, 4);

    -- ---- Acquire row-level locks on both credit wallets ----
    PERFORM 1 FROM CreditWallet WHERE company_id = p_buyer_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'WALLET_NOT_FOUND: Buyer company % has no credit wallet', p_buyer_id
            USING ERRCODE = 'P0001';
    END IF;

    SELECT balance
    INTO   v_seller_balance
    FROM   CreditWallet
    WHERE  company_id = v_seller_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'WALLET_NOT_FOUND: Seller company % has no credit wallet', v_seller_id
            USING ERRCODE = 'P0001';
    END IF;

    IF v_seller_balance < p_quantity THEN
        RAISE EXCEPTION 'INSUFFICIENT_QUANTITY: Seller wallet has % credits but listing requires % credits',
            v_seller_balance, p_quantity
            USING ERRCODE = 'P0001';
    END IF;

    -- ---- Insert transaction record ----
    INSERT INTO Transaction (listing_id, buyer_id, quantity, total_amount)
    VALUES (p_listing_id, p_buyer_id, p_quantity, v_total_amount)
    RETURNING txn_id INTO v_new_txn_id;

    -- ---- Credit wallet mutations ----
    -- The API issues CALL as a single statement, so PostgreSQL rolls back all
    -- changes from this procedure if any later validation or update fails.

    -- Transfer credits from seller to buyer. total_amount is monetary/reporting
    -- data only; it is not deducted from CreditWallet.
    UPDATE CreditWallet
    SET    balance      = balance + p_quantity,
           last_updated = CURRENT_TIMESTAMP
    WHERE  company_id   = p_buyer_id;

    UPDATE CreditWallet
    SET    balance      = balance - p_quantity,
           last_updated = CURRENT_TIMESTAMP
    WHERE  company_id   = v_seller_id;

    -- ---- Update listing quantity / status ----
    IF (v_listing_quantity - p_quantity) <= 0 THEN
        UPDATE MarketListing
        SET    quantity = 0,
               status   = 'Sold'
        WHERE  listing_id = p_listing_id;
    ELSE
        UPDATE MarketListing
        SET    quantity = quantity - p_quantity
        WHERE  listing_id = p_listing_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'execute_credit_purchase failed: %', SQLERRM
            USING ERRCODE = SQLSTATE;
END;
$$;

-- ============================================================
-- Procedure: generate_compliance_report
--
-- Uses explicit cursors to iterate over CarbonCredit and Transaction
-- records, aggregates totals, and inserts a ComplianceReport.
-- ============================================================
CREATE OR REPLACE PROCEDURE generate_compliance_report(
    p_company_id    INT,
    p_authority_id  INT
)
LANGUAGE plpgsql AS $$
DECLARE
    v_total_issued      NUMERIC := 0;
    v_total_traded      NUMERIC := 0;
    v_credit_row        RECORD;
    v_txn_row           RECORD;

    -- Cursor 1: All carbon credits issued to this company
    credit_cur CURSOR FOR
        SELECT credits_issued
        FROM   CarbonCredit
        WHERE  company_id = p_company_id;

    -- Cursor 2: All trade quantities where company was buyer OR seller
    txn_cur CURSOR FOR
        SELECT t.quantity
        FROM   Transaction t
        JOIN   MarketListing ml ON t.listing_id = ml.listing_id
        WHERE  t.buyer_id = p_company_id
           OR  ml.seller_id = p_company_id;
BEGIN
    -- Validate company exists
    PERFORM 1 FROM Company WHERE company_id = p_company_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'LOG_NOT_FOUND: Company % does not exist', p_company_id
            USING ERRCODE = 'P0001';
    END IF;

    -- Validate authority exists
    PERFORM 1 FROM RegulatoryAuthority WHERE authority_id = p_authority_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'LOG_NOT_FOUND: Regulatory authority % does not exist', p_authority_id
            USING ERRCODE = 'P0001';
    END IF;

    -- ---- Cursor loop 1: Aggregate total credits issued ----
    OPEN credit_cur;
    LOOP
        FETCH credit_cur INTO v_credit_row;
        EXIT WHEN NOT FOUND;
        v_total_issued := v_total_issued + v_credit_row.credits_issued;
    END LOOP;
    CLOSE credit_cur;

    -- ---- Cursor loop 2: Aggregate total credits traded ----
    OPEN txn_cur;
    LOOP
        FETCH txn_cur INTO v_txn_row;
        EXIT WHEN NOT FOUND;
        v_total_traded := v_total_traded + v_txn_row.quantity;
    END LOOP;
    CLOSE txn_cur;

    -- ---- Insert compliance report ----
    INSERT INTO ComplianceReport (
        company_id, authority_id,
        total_credits_issued, total_credits_traded,
        status
    )
    VALUES (
        p_company_id, p_authority_id,
        v_total_issued, v_total_traded,
        'Submitted'
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'generate_compliance_report failed: %', SQLERRM
            USING ERRCODE = SQLSTATE;
END;
$$;

-- ============================================================
-- Procedure: approve_energy_plant
--
-- Approves or rejects an EnergyPlant and records the audit decision.
-- Separate from verify_production_log — plant approval is a prerequisite.
-- ============================================================
CREATE OR REPLACE PROCEDURE approve_energy_plant(
    p_plant_id      INT,
    p_authority_id  INT,
    p_decision      VARCHAR,   -- 'Approved' or 'Rejected'
    p_remarks       TEXT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_current_status VARCHAR(20);
BEGIN
    IF p_decision NOT IN ('Approved', 'Rejected') THEN
        RAISE EXCEPTION 'Invalid decision %. Must be Approved or Rejected', p_decision
            USING ERRCODE = 'P0001';
    END IF;

    SELECT status
    INTO   v_current_status
    FROM   EnergyPlant
    WHERE  plant_id = p_plant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LOG_NOT_FOUND: Energy plant % does not exist', p_plant_id
            USING ERRCODE = 'P0001';
    END IF;

    UPDATE EnergyPlant
    SET    status = p_decision
    WHERE  plant_id = p_plant_id;

    INSERT INTO PlantVerificationLog (plant_id, authority_id, action, remarks)
    VALUES (p_plant_id, p_authority_id, p_decision, p_remarks);

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'approve_energy_plant failed: %', SQLERRM
            USING ERRCODE = SQLSTATE;
END;
$$;
