-- =============================================================================
-- Migration 002: Create indexes for performance optimization
-- Covers all FKs and frequently queried columns
-- =============================================================================

-- EnergyPlant indexes
CREATE INDEX IF NOT EXISTS idx_energyplant_company_id  ON EnergyPlant(company_id);
CREATE INDEX IF NOT EXISTS idx_energyplant_status       ON EnergyPlant(status);
CREATE INDEX IF NOT EXISTS idx_energyplant_type         ON EnergyPlant(type);

-- ProductionLog indexes
CREATE INDEX IF NOT EXISTS idx_productionlog_plant_id           ON ProductionLog(plant_id);
CREATE INDEX IF NOT EXISTS idx_productionlog_verification_status ON ProductionLog(verification_status);
CREATE INDEX IF NOT EXISTS idx_productionlog_log_date           ON ProductionLog(log_date);
CREATE INDEX IF NOT EXISTS idx_productionlog_submitted_at       ON ProductionLog(submitted_at);

-- CarbonCredit indexes
CREATE INDEX IF NOT EXISTS idx_carboncredit_company_id  ON CarbonCredit(company_id);
CREATE INDEX IF NOT EXISTS idx_carboncredit_log_id      ON CarbonCredit(log_id);
CREATE INDEX IF NOT EXISTS idx_carboncredit_issued_date ON CarbonCredit(issued_date);

-- CreditWallet indexes
CREATE INDEX IF NOT EXISTS idx_creditwallet_company_id ON CreditWallet(company_id);

-- MarketListing indexes
CREATE INDEX IF NOT EXISTS idx_marketlisting_seller_id      ON MarketListing(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketlisting_credit_id      ON MarketListing(credit_id);
CREATE INDEX IF NOT EXISTS idx_marketlisting_status         ON MarketListing(status);
CREATE INDEX IF NOT EXISTS idx_marketlisting_created_at     ON MarketListing(created_at);
CREATE INDEX IF NOT EXISTS idx_marketlisting_status_created ON MarketListing(status, created_at DESC);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transaction_listing_id ON Transaction(listing_id);
CREATE INDEX IF NOT EXISTS idx_transaction_buyer_id   ON Transaction(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_txn_date   ON Transaction(txn_date);

-- ComplianceReport indexes
CREATE INDEX IF NOT EXISTS idx_compliancereport_company_id   ON ComplianceReport(company_id);
CREATE INDEX IF NOT EXISTS idx_compliancereport_authority_id ON ComplianceReport(authority_id);
CREATE INDEX IF NOT EXISTS idx_compliancereport_status       ON ComplianceReport(status);
CREATE INDEX IF NOT EXISTS idx_compliancereport_report_date  ON ComplianceReport(report_date);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id   ON Users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_authority_id ON Users(authority_id);
CREATE INDEX IF NOT EXISTS idx_users_role         ON Users(role);

-- PlantVerificationLog indexes
CREATE INDEX IF NOT EXISTS idx_plantverificationlog_plant_id     ON PlantVerificationLog(plant_id);
CREATE INDEX IF NOT EXISTS idx_plantverificationlog_authority_id ON PlantVerificationLog(authority_id);
CREATE INDEX IF NOT EXISTS idx_plantverificationlog_action_date  ON PlantVerificationLog(action_date);
