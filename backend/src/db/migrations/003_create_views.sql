-- =============================================================================
-- Migration 003: Create analytical views
-- =============================================================================

DROP VIEW IF EXISTS active_listings_view CASCADE;
DROP VIEW IF EXISTS compliance_summary_view CASCADE;
DROP VIEW IF EXISTS credit_issuance_trends_view CASCADE;
DROP VIEW IF EXISTS marketplace_volume_view CASCADE;
DROP VIEW IF EXISTS company_performance_view CASCADE;
DROP VIEW IF EXISTS top_buyers_view CASCADE;

-- ============================================================
-- View: active_listings_view
-- Joins MarketListing, Company (seller), CarbonCredit
-- ============================================================
CREATE VIEW active_listings_view AS
SELECT
    ml.listing_id,
    ml.seller_id,
    c.name                      AS seller_name,
    c.registration_no           AS seller_reg_no,
    ml.credit_id,
    cc.credits_issued           AS original_credits,
    ml.quantity                 AS credits_available,
    ml.price_per_credit,
    ml.quantity * ml.price_per_credit AS total_value,
    ml.status,
    ml.created_at
FROM MarketListing ml
JOIN Company c          ON ml.seller_id = c.company_id
JOIN CarbonCredit cc    ON ml.credit_id = cc.credit_id
WHERE ml.status = 'Active';

-- ============================================================
-- View: compliance_summary_view
-- Aggregates total credits issued and traded per company
-- ============================================================
CREATE VIEW compliance_summary_view AS
SELECT
    cr.company_id,
    c.name                              AS company_name,
    SUM(cr.total_credits_issued)        AS total_issued,
    SUM(cr.total_credits_traded)        AS total_traded,
    SUM(cr.total_credits_traded)
        / NULLIF(SUM(cr.total_credits_issued), 0) AS compliance_ratio,
    COUNT(cr.report_id)                 AS report_count
FROM ComplianceReport cr
JOIN Company c ON cr.company_id = c.company_id
GROUP BY cr.company_id, c.name;

-- ============================================================
-- View: credit_issuance_trends_view
-- Monthly aggregation of credits issued
-- ============================================================
CREATE VIEW credit_issuance_trends_view AS
SELECT
    DATE_TRUNC('month', cc.issued_date)     AS month,
    COUNT(cc.credit_id)                     AS credits_count,
    SUM(cc.credits_issued)                  AS total_credits,
    c.industry
FROM CarbonCredit cc
JOIN Company c ON cc.company_id = c.company_id
GROUP BY DATE_TRUNC('month', cc.issued_date), c.industry
ORDER BY month DESC;

-- ============================================================
-- View: marketplace_volume_view
-- Monthly trading volume report
-- ============================================================
CREATE VIEW marketplace_volume_view AS
SELECT
    DATE_TRUNC('month', t.txn_date)     AS month,
    COUNT(t.txn_id)                     AS transaction_count,
    SUM(t.quantity)                     AS total_credits_traded,
    SUM(t.total_amount)                 AS total_volume,
    SUM(t.total_amount * 0.02)          AS total_fees_collected
FROM Transaction t
GROUP BY DATE_TRUNC('month', t.txn_date)
ORDER BY month DESC;

-- ============================================================
-- View: company_performance_view
-- Comprehensive company performance metrics
-- ============================================================
CREATE VIEW company_performance_view AS
SELECT
    c.company_id,
    c.name,
    c.industry,
    COALESCE(SUM(cc.credits_issued), 0)     AS total_issued,
    COALESCE(
        (SELECT SUM(t.quantity)
         FROM Transaction t
         JOIN MarketListing ml ON t.listing_id = ml.listing_id
         WHERE ml.seller_id = c.company_id), 0
    )                                       AS total_sold,
    COALESCE(
        (SELECT SUM(t.quantity)
         FROM Transaction t
         WHERE t.buyer_id = c.company_id), 0
    )                                       AS total_bought,
    COALESCE(cw.balance, 0)                 AS wallet_balance,
    COUNT(ep.plant_id)                      AS plant_count
FROM Company c
LEFT JOIN CarbonCredit cc   ON c.company_id = cc.company_id
LEFT JOIN CreditWallet cw   ON c.company_id = cw.company_id
LEFT JOIN EnergyPlant ep    ON c.company_id = ep.company_id
GROUP BY c.company_id, c.name, c.industry, cw.balance
HAVING COALESCE(SUM(cc.credits_issued), 0) > 0 OR COALESCE(cw.balance, 0) > 0;

-- ============================================================
-- View: top_buyers_view
-- Ranking companies by total credits purchased
-- ============================================================
CREATE VIEW top_buyers_view AS
SELECT
    t.buyer_id,
    c.name                          AS buyer_name,
    c.industry,
    COUNT(t.txn_id)                 AS transaction_count,
    SUM(t.quantity)                 AS total_credits_purchased,
    SUM(t.total_amount)             AS total_spent,
    RANK() OVER (
        ORDER BY SUM(t.quantity) DESC
    )                               AS buyer_rank
FROM Transaction t
JOIN Company c ON t.buyer_id = c.company_id
GROUP BY t.buyer_id, c.name, c.industry
ORDER BY total_credits_purchased DESC;
