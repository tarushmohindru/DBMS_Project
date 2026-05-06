-- =============================================================================
-- PL/pgSQL Cursor-Based Functions
-- Returns SETOF composite types using explicit cursors
-- =============================================================================

-- ============================================================
-- Function: generate_periodic_compliance_summary
--
-- Uses an explicit cursor to iterate over all companies under a given
-- regulatory authority's jurisdiction (companies with reports filed
-- under that authority). Returns compliance_summary_record SETOF.
--
-- Result columns:
--   company_name     — name of the company
--   total_issued     — sum of all carbon credits ever issued
--   total_traded     — sum of all credits traded (bought + sold)
--   compliance_ratio — total_traded / total_issued (NULL if 0 issued)
-- ============================================================
CREATE OR REPLACE FUNCTION generate_periodic_compliance_summary(p_authority_id INT)
RETURNS SETOF compliance_summary_record
LANGUAGE plpgsql AS $$
DECLARE
    v_result        compliance_summary_record;
    v_company       RECORD;
    v_total_issued  NUMERIC;
    v_total_traded  NUMERIC;

    -- Explicit cursor: companies that have at least one report with this authority
    company_cur CURSOR FOR
        SELECT DISTINCT c.company_id, c.name
        FROM   Company c
        JOIN   ComplianceReport cr ON c.company_id = cr.company_id
        WHERE  cr.authority_id = p_authority_id
        ORDER  BY c.name;
BEGIN
    OPEN company_cur;

    LOOP
        FETCH company_cur INTO v_company;
        EXIT WHEN NOT FOUND;

        -- Aggregate totals from ComplianceReport for this company + authority
        SELECT
            COALESCE(SUM(cr.total_credits_issued), 0),
            COALESCE(SUM(cr.total_credits_traded), 0)
        INTO v_total_issued, v_total_traded
        FROM ComplianceReport cr
        WHERE cr.company_id   = v_company.company_id
          AND cr.authority_id = p_authority_id;

        v_result.company_name     := v_company.name;
        v_result.total_issued     := v_total_issued;
        v_result.total_traded     := v_total_traded;
        v_result.compliance_ratio :=
            v_total_traded / NULLIF(v_total_issued, 0);

        RETURN NEXT v_result;
    END LOOP;

    CLOSE company_cur;
    RETURN;
END;
$$;

-- ============================================================
-- Function: get_active_listings_cursor
--
-- Iterates over all Active marketplace listings via explicit cursor,
-- joining MarketListing → Company (seller) → CarbonCredit.
-- Returns active_listing_record SETOF.
--
-- Result columns:
--   listing_id        — PK of the listing
--   seller_name       — company name of the seller
--   credits_available — remaining quantity in this listing
--   price_per_credit  — price per carbon credit unit
--   total_value       — credits_available × price_per_credit
-- ============================================================
CREATE OR REPLACE FUNCTION get_active_listings_cursor()
RETURNS SETOF active_listing_record
LANGUAGE plpgsql AS $$
DECLARE
    v_result  active_listing_record;
    v_row     RECORD;

    -- Explicit cursor over Active listings
    listing_cur CURSOR FOR
        SELECT
            ml.listing_id,
            c.name          AS seller_name,
            ml.quantity,
            ml.price_per_credit
        FROM   MarketListing ml
        JOIN   Company       c  ON ml.seller_id  = c.company_id
        JOIN   CarbonCredit  cc ON ml.credit_id  = cc.credit_id
        WHERE  ml.status = 'Active'
        ORDER  BY ml.created_at DESC;
BEGIN
    OPEN listing_cur;

    LOOP
        FETCH listing_cur INTO v_row;
        EXIT WHEN NOT FOUND;

        v_result.listing_id        := v_row.listing_id;
        v_result.seller_name       := v_row.seller_name;
        v_result.credits_available := v_row.quantity;
        v_result.price_per_credit  := v_row.price_per_credit;
        v_result.total_value       := v_row.quantity * v_row.price_per_credit;

        RETURN NEXT v_result;
    END LOOP;

    CLOSE listing_cur;
    RETURN;
END;
$$;
