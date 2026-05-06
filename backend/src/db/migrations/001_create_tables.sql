-- =============================================================================
-- Migration 001: Create all tables (3NF Normalized Schema)
-- Renewable Energy Trading & Carbon Credit Marketplace
-- =============================================================================

-- Drop existing tables in reverse dependency order (for reruns)
DROP TABLE IF EXISTS PlantVerificationLog CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS ComplianceReport CASCADE;
DROP TABLE IF EXISTS Transaction CASCADE;
DROP TABLE IF EXISTS MarketListing CASCADE;
DROP TABLE IF EXISTS CreditWallet CASCADE;
DROP TABLE IF EXISTS CarbonCredit CASCADE;
DROP TABLE IF EXISTS ProductionLog CASCADE;
DROP TABLE IF EXISTS EnergyPlant CASCADE;
DROP TABLE IF EXISTS RegulatoryAuthority CASCADE;
DROP TABLE IF EXISTS Company CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS compliance_summary_record CASCADE;
DROP TYPE IF EXISTS active_listing_record CASCADE;

-- ============================================================
-- Table: Company
-- Stores registered energy companies (1NF: no repeating groups,
-- 2NF: all non-key columns depend on company_id PK,
-- 3NF: no transitive dependencies)
-- ============================================================
CREATE TABLE Company (
    company_id      SERIAL          PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    industry        VARCHAR(100),
    registration_no VARCHAR(100)    UNIQUE NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: RegulatoryAuthority
-- Independent table with no transitive dependencies (3NF)
-- ============================================================
CREATE TABLE RegulatoryAuthority (
    authority_id    SERIAL          PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    jurisdiction    VARCHAR(255),
    contact_email   VARCHAR(255)
);

-- ============================================================
-- Table: EnergyPlant
-- company_id FK ensures referential integrity; type CHECK enforces domain
-- ============================================================
CREATE TABLE EnergyPlant (
    plant_id    SERIAL          PRIMARY KEY,
    company_id  INT             NOT NULL REFERENCES Company(company_id) ON DELETE CASCADE,
    name        VARCHAR(255)    NOT NULL,
    type        VARCHAR(50)     NOT NULL CHECK (type IN ('Solar','Wind','Hydro','Biomass')),
    capacity    NUMERIC(15,2)   CHECK (capacity > 0),
    location    VARCHAR(255),
    status      VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                CHECK (status IN ('Pending','Approved','Rejected')),
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: ProductionLog
-- energy_kwh > 0 enforced at DB level; one log per plant per date
-- ============================================================
CREATE TABLE ProductionLog (
    log_id              SERIAL          PRIMARY KEY,
    plant_id            INT             NOT NULL REFERENCES EnergyPlant(plant_id) ON DELETE CASCADE,
    log_date            DATE            NOT NULL,
    energy_kwh          NUMERIC(15,2)   NOT NULL CHECK (energy_kwh > 0),
    verification_status VARCHAR(20)     NOT NULL DEFAULT 'Pending'
                                        CHECK (verification_status IN ('Pending','Verified','Rejected')),
    submitted_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_productionlog_plant_date UNIQUE (plant_id, log_date)
);

-- ============================================================
-- Table: CarbonCredit
-- log_id UNIQUE enforces 1:1 with ProductionLog (no duplicate issuance)
-- ============================================================
CREATE TABLE CarbonCredit (
    credit_id       SERIAL          PRIMARY KEY,
    company_id      INT             NOT NULL REFERENCES Company(company_id),
    log_id          INT             NOT NULL UNIQUE REFERENCES ProductionLog(log_id),
    credits_issued  NUMERIC(15,4)   NOT NULL CHECK (credits_issued > 0),
    issued_date     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: CreditWallet
-- company_id UNIQUE ensures one wallet per company; balance >= 0 enforced
-- ============================================================
CREATE TABLE CreditWallet (
    wallet_id       SERIAL          PRIMARY KEY,
    company_id      INT             NOT NULL UNIQUE REFERENCES Company(company_id),
    balance         NUMERIC(15,4)   NOT NULL DEFAULT 0 CHECK (balance >= 0),
    last_updated    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: MarketListing
-- Active listings must have positive quantity; sold-out listings can reach 0
-- ============================================================
CREATE TABLE MarketListing (
    listing_id      SERIAL          PRIMARY KEY,
    seller_id       INT             NOT NULL REFERENCES Company(company_id),
    credit_id       INT             NOT NULL REFERENCES CarbonCredit(credit_id),
    quantity        NUMERIC(15,4)   NOT NULL,
    price_per_credit NUMERIC(15,4)  NOT NULL CHECK (price_per_credit > 0),
    status          VARCHAR(20)     NOT NULL DEFAULT 'Active'
                                    CHECK (status IN ('Active','Sold','Cancelled')),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_marketlisting_quantity_status CHECK (
        (status = 'Active' AND quantity > 0)
        OR (status IN ('Sold','Cancelled') AND quantity >= 0)
    )
);

-- ============================================================
-- Table: Transaction
-- Immutable trade record; total_amount = quantity × price_per_credit
-- ============================================================
CREATE TABLE Transaction (
    txn_id          SERIAL          PRIMARY KEY,
    listing_id      INT             NOT NULL REFERENCES MarketListing(listing_id),
    buyer_id        INT             NOT NULL REFERENCES Company(company_id),
    quantity        NUMERIC(15,4)   NOT NULL CHECK (quantity > 0),
    total_amount    NUMERIC(15,4)   NOT NULL CHECK (total_amount > 0),
    txn_date        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: ComplianceReport
-- Status lifecycle: Draft → Submitted → Audited
-- ============================================================
CREATE TABLE ComplianceReport (
    report_id               SERIAL          PRIMARY KEY,
    company_id              INT             NOT NULL REFERENCES Company(company_id),
    authority_id            INT             NOT NULL REFERENCES RegulatoryAuthority(authority_id),
    report_date             DATE            NOT NULL DEFAULT CURRENT_DATE,
    total_credits_issued    NUMERIC(15,4)   NOT NULL DEFAULT 0,
    total_credits_traded    NUMERIC(15,4)   NOT NULL DEFAULT 0,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'Draft'
                                            CHECK (status IN ('Draft','Submitted','Audited')),
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: Users
-- Supports 3 roles; company_id XOR authority_id depending on role
-- ============================================================
CREATE TABLE Users (
    user_id         SERIAL          PRIMARY KEY,
    username        VARCHAR(100)    UNIQUE NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(30)     NOT NULL
                                    CHECK (role IN ('company_admin','regulatory_authority','marketplace_admin')),
    company_id      INT             REFERENCES Company(company_id),
    authority_id    INT             REFERENCES RegulatoryAuthority(authority_id),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Ensure role-appropriate associations
    CONSTRAINT chk_role_company
        CHECK (
            (role = 'company_admin' AND company_id IS NOT NULL AND authority_id IS NULL)
            OR role <> 'company_admin'
        ),
    CONSTRAINT chk_role_authority
        CHECK (
            (role = 'regulatory_authority' AND authority_id IS NOT NULL AND company_id IS NULL)
            OR role <> 'regulatory_authority'
        ),
    CONSTRAINT chk_role_marketplace
        CHECK (
            (role = 'marketplace_admin' AND company_id IS NULL AND authority_id IS NULL)
            OR role <> 'marketplace_admin'
        )
);

-- ============================================================
-- Table: PlantVerificationLog  (Audit Trail)
-- Records every regulatory decision on plants AND production logs
-- action distinguishes: 'Approved','Rejected','LOG_Verified','LOG_Rejected'
-- ============================================================
CREATE TABLE PlantVerificationLog (
    verification_id SERIAL          PRIMARY KEY,
    plant_id        INT             NOT NULL REFERENCES EnergyPlant(plant_id),
    authority_id    INT             NOT NULL REFERENCES RegulatoryAuthority(authority_id),
    action          VARCHAR(50)     NOT NULL,
    action_date     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks         TEXT
);

-- ============================================================
-- Custom composite types for cursor-based functions
-- ============================================================
CREATE TYPE compliance_summary_record AS (
    company_name        VARCHAR(255),
    total_issued        NUMERIC,
    total_traded        NUMERIC,
    compliance_ratio    NUMERIC
);

CREATE TYPE active_listing_record AS (
    listing_id          INT,
    seller_name         VARCHAR(255),
    credits_available   NUMERIC,
    price_per_credit    NUMERIC,
    total_value         NUMERIC
);
