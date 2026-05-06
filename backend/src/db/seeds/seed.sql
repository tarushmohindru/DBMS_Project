-- =============================================================================
-- Seed Data — Realistic sample data for all tables
-- Triggers are disabled during seeding to allow direct insertion.
-- =============================================================================

BEGIN;

-- ============================================================
-- Disable triggers that would interfere with direct seeding
-- ============================================================
ALTER TABLE Company        DISABLE TRIGGER trg_auto_create_wallet;
ALTER TABLE CarbonCredit   DISABLE TRIGGER trg_prevent_duplicate_credit;
ALTER TABLE ProductionLog  DISABLE TRIGGER trg_auto_issue_credits;
ALTER TABLE Transaction    DISABLE TRIGGER trg_update_wallet_after_transaction;
ALTER TABLE CreditWallet   DISABLE TRIGGER trg_prevent_negative_wallet;

-- ============================================================
-- RegulatoryAuthority (2 records)
-- ============================================================
INSERT INTO RegulatoryAuthority (authority_id, name, jurisdiction, contact_email) VALUES
(1, 'Ministry of New and Renewable Energy', 'India - National', 'mnre@gov.in'),
(2, 'Central Electricity Regulatory Commission', 'India - National', 'cerc@gov.in');

-- ============================================================
-- Company (5 records)
-- ============================================================
INSERT INTO Company (company_id, name, industry, registration_no) VALUES
(1, 'SolarTech India Ltd',      'Solar Energy',    'REG-2024-001'),
(2, 'WindPower Corp',           'Wind Energy',     'REG-2024-002'),
(3, 'HydroEnergy Solutions',    'Hydro Power',     'REG-2024-003'),
(4, 'BioGreen Energy Ltd',      'Biomass Energy',  'REG-2024-004'),
(5, 'CleanEnergy Ventures',     'Multi-Renewable', 'REG-2024-005');

-- ============================================================
-- CreditWallet (5 records — manual insert since trigger disabled)
-- Balances are carbon credits owned after seed transactions:
-- issued credits + purchased credits - sold credits
-- ============================================================
INSERT INTO CreditWallet (wallet_id, company_id, balance, last_updated) VALUES
(1, 1,  95.0000, CURRENT_TIMESTAMP),  -- SolarTech:   95 issued - 10 sold + 10 bought
(2, 2,  90.0000, CURRENT_TIMESTAMP),  -- WindPower:  155 issued - 65 sold
(3, 3, 100.0000, CURRENT_TIMESTAMP),  -- HydroEnergy: 120 issued - 25 sold + 5 bought
(4, 4,  20.0000, CURRENT_TIMESTAMP),  -- BioGreen:    30 issued - 20 sold + 10 bought
(5, 5,  95.0000, CURRENT_TIMESTAMP);  -- CleanEnergy: 95 purchased

-- ============================================================
-- EnergyPlant (6 records)
-- ============================================================
INSERT INTO EnergyPlant (plant_id, company_id, name, type, capacity, location, status) VALUES
(1, 1, 'Solar Plant Alpha',     'Solar',   5000.00, 'Rajasthan, India',         'Approved'),
(2, 1, 'Solar Plant Beta',      'Solar',   3000.00, 'Gujarat, India',            'Pending'),
(3, 2, 'Wind Farm North',       'Wind',    8000.00, 'Tamil Nadu, India',         'Approved'),
(4, 2, 'Wind Farm South',       'Wind',    6000.00, 'Maharashtra, India',        'Rejected'),
(5, 3, 'Hydro Dam East',        'Hydro',  12000.00, 'Himachal Pradesh, India',   'Approved'),
(6, 4, 'Bio Plant Central',     'Biomass', 3500.00, 'Madhya Pradesh, India',     'Approved');

-- ============================================================
-- ProductionLog (8 records — mix of Verified/Pending/Rejected)
-- ============================================================
INSERT INTO ProductionLog (log_id, plant_id, log_date, energy_kwh, verification_status) VALUES
(1, 1, '2025-01-31', 50000.00,  'Verified'),   -- SolarTech Alpha, Jan
(2, 1, '2025-02-28', 45000.00,  'Verified'),   -- SolarTech Alpha, Feb
(3, 3, '2025-01-31', 80000.00,  'Verified'),   -- WindPower North, Jan
(4, 3, '2025-02-28', 75000.00,  'Verified'),   -- WindPower North, Feb
(5, 5, '2025-01-31', 120000.00, 'Verified'),   -- HydroEnergy, Jan
(6, 6, '2025-01-31', 30000.00,  'Verified'),   -- BioGreen, Jan
(7, 2, '2025-01-31', 15000.00,  'Pending'),    -- Solar Beta (plant pending)
(8, 1, '2025-03-31', 55000.00,  'Rejected');   -- SolarTech Alpha, Mar (rejected)

-- ============================================================
-- CarbonCredit (6 records — only for Verified logs)
-- ============================================================
INSERT INTO CarbonCredit (credit_id, company_id, log_id, credits_issued, issued_date) VALUES
(1, 1, 1,  50.0000, '2025-02-01 09:00:00'),  -- SolarTech: 50000 kWh × 0.001
(2, 1, 2,  45.0000, '2025-03-01 09:00:00'),  -- SolarTech: 45000 kWh × 0.001
(3, 2, 3,  80.0000, '2025-02-01 10:00:00'),  -- WindPower: 80000 kWh × 0.001
(4, 2, 4,  75.0000, '2025-03-01 10:00:00'),  -- WindPower: 75000 kWh × 0.001
(5, 3, 5, 120.0000, '2025-02-01 11:00:00'),  -- HydroEnergy: 120000 kWh × 0.001
(6, 4, 6,  30.0000, '2025-02-01 12:00:00');  -- BioGreen: 30000 kWh × 0.001

-- ============================================================
-- MarketListing (6 records — mix of Active/Sold/Cancelled)
-- ============================================================
INSERT INTO MarketListing (listing_id, seller_id, credit_id, quantity, price_per_credit, status) VALUES
(1, 1, 1,  20.0000,  8.00, 'Active'),      -- SolarTech lists 20 credits at 8 INR/credit
(2, 2, 3,  50.0000,  7.00, 'Sold'),        -- WindPower listed 50 (all sold)
(3, 3, 5,  40.0000,  9.00, 'Active'),      -- HydroEnergy lists 40 at 9 INR/credit
(4, 2, 4,  25.0000,  7.50, 'Active'),      -- WindPower lists 25 more
(5, 4, 6,  20.0000,  6.00, 'Sold'),        -- BioGreen listed 20 (all sold)
(6, 1, 2,  20.0000,  8.50, 'Cancelled');   -- SolarTech cancelled listing

-- ============================================================
-- Transaction (8 records)
-- total_amount = quantity × price_per_credit
-- ============================================================
INSERT INTO Transaction (txn_id, listing_id, buyer_id, quantity, total_amount, txn_date) VALUES
(1, 2, 5,  30.0000, 210.0000, '2025-02-15 10:30:00'),  -- CleanEnergy buys 30 from WindPower listing
(2, 2, 5,  20.0000, 140.0000, '2025-02-16 11:00:00'),  -- CleanEnergy buys rest of listing 2 → Sold
(3, 5, 5,  20.0000, 120.0000, '2025-02-20 09:00:00'),  -- CleanEnergy buys all of BioGreen listing → Sold
(4, 3, 5,  15.0000, 135.0000, '2025-03-01 14:00:00'),  -- CleanEnergy buys 15 from HydroEnergy
(5, 3, 1,  10.0000,  90.0000, '2025-03-05 15:00:00'),  -- SolarTech buys 10 from HydroEnergy
(6, 4, 3,   5.0000,  37.5000, '2025-03-10 10:00:00'),  -- HydroEnergy buys 5 from WindPower
(7, 4, 5,  10.0000,  75.0000, '2025-03-12 11:00:00'),  -- CleanEnergy buys 10 from WindPower
(8, 1, 4,  10.0000,  80.0000, '2025-03-15 09:00:00');  -- BioGreen buys 10 from SolarTech

-- ============================================================
-- PlantVerificationLog (audit trail)
-- ============================================================
INSERT INTO PlantVerificationLog (plant_id, authority_id, action, remarks) VALUES
(1, 1, 'Approved',      'Plant meets all MNRE solar specifications'),
(2, 1, 'Pending',       'Under review by MNRE inspectors'),
(3, 2, 'Approved',      'Wind farm certified by CERC'),
(4, 2, 'Rejected',      'Site does not meet environmental clearance requirements'),
(5, 1, 'Approved',      'Hydro plant cleared by MNRE'),
(6, 1, 'Approved',      'Biomass plant verified and certified'),
(1, 1, 'LOG_Verified',  'January 2025 production log verified - 50 MWh'),
(1, 1, 'LOG_Verified',  'February 2025 production log verified - 45 MWh'),
(3, 2, 'LOG_Verified',  'January 2025 production log verified - 80 MWh'),
(3, 2, 'LOG_Verified',  'February 2025 production log verified - 75 MWh'),
(5, 1, 'LOG_Verified',  'January 2025 production log verified - 120 MWh'),
(6, 1, 'LOG_Verified',  'January 2025 production log verified - 30 MWh'),
(1, 1, 'LOG_Rejected',  'March 2025 log rejected - meter calibration error detected');

-- ============================================================
-- ComplianceReport (4 records)
-- ============================================================
INSERT INTO ComplianceReport (company_id, authority_id, report_date, total_credits_issued, total_credits_traded, status) VALUES
(1, 1, '2025-03-31', 95.0000,  100.0000, 'Submitted'),   -- SolarTech Q1 report
(2, 2, '2025-03-31', 155.0000, 120.0000, 'Audited'),     -- WindPower Q1 report (audited)
(3, 1, '2025-03-31', 120.0000,  57.5000, 'Submitted'),   -- HydroEnergy Q1 report
(4, 1, '2025-03-31',  30.0000,  90.0000, 'Draft');       -- BioGreen Q1 report (draft)

-- ============================================================
-- Users (3 records — one per role)
-- Passwords are bcrypt hashes of: 'password123'
-- Generated with bcrypt saltRounds=12
-- ============================================================
INSERT INTO Users (user_id, username, password_hash, role, company_id, authority_id) VALUES
(1,
 'company_admin',
 '$2a$12$P3E2iK8WqxTmE2HV/VxhouDjNJyaMFGHGOVU14j9/A6eo/Vf3HH9.',
 'company_admin',
 1,
 NULL),
(2,
 'reg_authority',
 '$2a$12$P3E2iK8WqxTmE2HV/VxhouDjNJyaMFGHGOVU14j9/A6eo/Vf3HH9.',
 'regulatory_authority',
 NULL,
 1),
(3,
 'marketplace_admin',
 '$2a$12$P3E2iK8WqxTmE2HV/VxhouDjNJyaMFGHGOVU14j9/A6eo/Vf3HH9.',
 'marketplace_admin',
 NULL,
 NULL);

-- ============================================================
-- Reset sequences to avoid PK conflicts after direct inserts
-- ============================================================
SELECT setval('company_company_id_seq',            (SELECT MAX(company_id)        FROM Company));
SELECT setval('regulatoryauthority_authority_id_seq',(SELECT MAX(authority_id)    FROM RegulatoryAuthority));
SELECT setval('energyplant_plant_id_seq',          (SELECT MAX(plant_id)          FROM EnergyPlant));
SELECT setval('productionlog_log_id_seq',          (SELECT MAX(log_id)            FROM ProductionLog));
SELECT setval('carboncredit_credit_id_seq',        (SELECT MAX(credit_id)         FROM CarbonCredit));
SELECT setval('creditwallet_wallet_id_seq',        (SELECT MAX(wallet_id)         FROM CreditWallet));
SELECT setval('marketlisting_listing_id_seq',      (SELECT MAX(listing_id)        FROM MarketListing));
SELECT setval('transaction_txn_id_seq',            (SELECT MAX(txn_id)            FROM Transaction));
SELECT setval('compliancereport_report_id_seq',    (SELECT MAX(report_id)         FROM ComplianceReport));
SELECT setval('users_user_id_seq',                 (SELECT MAX(user_id)           FROM Users));

-- ============================================================
-- Re-enable all triggers
-- ============================================================
ALTER TABLE Company        ENABLE TRIGGER trg_auto_create_wallet;
ALTER TABLE CarbonCredit   ENABLE TRIGGER trg_prevent_duplicate_credit;
ALTER TABLE ProductionLog  ENABLE TRIGGER trg_auto_issue_credits;
ALTER TABLE Transaction    ENABLE TRIGGER trg_update_wallet_after_transaction;
ALTER TABLE CreditWallet   ENABLE TRIGGER trg_prevent_negative_wallet;

COMMIT;
