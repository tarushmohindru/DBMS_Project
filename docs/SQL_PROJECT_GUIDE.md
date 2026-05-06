# SQL Project Guide: Carbon Credit Marketplace

This document explains the complete SQL design used in the project: tables, keys, relationships, constraints, indexes, views, PL/pgSQL functions, stored procedures, triggers, cursor-based functions, seed data, and common viva questions.

## 1. Project Idea

The project models a carbon credit marketplace for renewable energy companies.

High-level flow:

1. A company registers.
2. A credit wallet is created for the company.
3. The company registers renewable energy plants.
4. A regulatory authority approves or rejects plants.
5. The company submits production logs for approved plants.
6. The regulatory authority verifies production logs.
7. Verified production logs generate carbon credits.
8. Companies list carbon credits on the marketplace.
9. Other companies buy credits.
10. Credit quantity moves from seller wallet to buyer wallet.
11. Trade amount is stored as monetary/reporting value.
12. Companies generate compliance reports.
13. Regulatory authorities audit compliance reports.

Important design decision:

`CreditWallet.balance` stores carbon credits only. It is not money. During a purchase, the seller loses credit quantity and the buyer gains credit quantity. `Transaction.total_amount` is only the reported monetary value of the trade.

## 2. SQL Files

The SQL code is organized under `backend/src/db`.

| File | Purpose |
| --- | --- |
| `migrations/001_create_tables.sql` | Creates tables, constraints, and custom composite types |
| `migrations/002_create_indexes.sql` | Creates performance indexes |
| `migrations/003_create_views.sql` | Creates analytical and reporting views |
| `procedures/functions.sql` | PL/pgSQL scalar/helper functions |
| `procedures/procedures.sql` | Stored procedures for main workflows |
| `procedures/triggers.sql` | Trigger functions and triggers |
| `procedures/cursors.sql` | Cursor-based functions returning composite types |
| `seeds/seed.sql` | Inserts sample data and resets sequences |

The Docker init script executes them in this order:

1. Tables
2. Indexes
3. Views
4. Functions
5. Procedures
6. Triggers
7. Cursor functions
8. Seed data

This order matters because later objects depend on earlier objects. For example, triggers depend on trigger functions, and views depend on base tables.

## 3. Main Entities

The project has these main tables:

| Table | Meaning |
| --- | --- |
| `Company` | Renewable energy companies |
| `RegulatoryAuthority` | Government/regulatory bodies |
| `EnergyPlant` | Renewable plants owned by companies |
| `ProductionLog` | Energy generation logs submitted by companies |
| `CarbonCredit` | Credits issued from verified production logs |
| `CreditWallet` | Current carbon credit balance of each company |
| `MarketListing` | Credits listed for sale |
| `Transaction` | Completed credit purchases |
| `ComplianceReport` | Company compliance report submitted to an authority |
| `Users` | Login users and roles |
| `PlantVerificationLog` | Audit trail for plant and log decisions |

## 4. Relationship Summary

The major relationships are:

```text
Company 1 ── * EnergyPlant
EnergyPlant 1 ── * ProductionLog
ProductionLog 1 ── 0/1 CarbonCredit
Company 1 ── * CarbonCredit
Company 1 ── 1 CreditWallet
Company 1 ── * MarketListing as seller
CarbonCredit 1 ── * MarketListing
MarketListing 1 ── * Transaction
Company 1 ── * Transaction as buyer
Company 1 ── * ComplianceReport
RegulatoryAuthority 1 ── * ComplianceReport
RegulatoryAuthority 1 ── * PlantVerificationLog
EnergyPlant 1 ── * PlantVerificationLog
Company 1 ── 0/1 Users for company_admin
RegulatoryAuthority 1 ── 0/1 Users for regulatory_authority
```

## 5. Table-by-Table Explanation

### 5.1 `Company`

Stores registered renewable energy companies.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `company_id` | `SERIAL PRIMARY KEY` | Unique company id |
| `name` | `VARCHAR(255) NOT NULL` | Company name |
| `industry` | `VARCHAR(100)` | Sector such as Solar, Wind, Biomass |
| `registration_no` | `VARCHAR(100) UNIQUE NOT NULL` | Government/business registration number |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Insert timestamp |

Important constraints:

- `company_id` is the primary key.
- `registration_no` is unique, so two companies cannot register with the same number.

Normalization:

- Company details are stored only once.
- Other tables reference `Company(company_id)` instead of repeating company name or registration number.

### 5.2 `RegulatoryAuthority`

Stores regulatory bodies.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `authority_id` | `SERIAL PRIMARY KEY` | Unique authority id |
| `name` | `VARCHAR(255) NOT NULL` | Authority name |
| `jurisdiction` | `VARCHAR(255)` | Area controlled by authority |
| `contact_email` | `VARCHAR(255)` | Contact email |

This table is independent and referenced by compliance reports and verification logs.

### 5.3 `EnergyPlant`

Stores renewable plants owned by companies.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `plant_id` | `SERIAL PRIMARY KEY` | Unique plant id |
| `company_id` | `INT NOT NULL REFERENCES Company(company_id) ON DELETE CASCADE` | Owner company |
| `name` | `VARCHAR(255) NOT NULL` | Plant name |
| `type` | `VARCHAR(50)` | Plant type |
| `capacity` | `NUMERIC(15,2)` | Capacity in kW |
| `location` | `VARCHAR(255)` | Plant location |
| `status` | `VARCHAR(20) DEFAULT 'Pending'` | Approval status |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Insert timestamp |

Important constraints:

- `company_id` is a foreign key to `Company`.
- `ON DELETE CASCADE` means if a company is deleted, its plants are deleted automatically.
- `type CHECK (type IN ('Solar','Wind','Hydro','Biomass'))`.
- `capacity CHECK (capacity > 0)`.
- `status CHECK (status IN ('Pending','Approved','Rejected'))`.

Business rule:

- A company can submit production logs only for approved plants.

### 5.4 `ProductionLog`

Stores energy production records submitted by companies.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `log_id` | `SERIAL PRIMARY KEY` | Unique log id |
| `plant_id` | `INT NOT NULL REFERENCES EnergyPlant(plant_id) ON DELETE CASCADE` | Plant that generated energy |
| `log_date` | `DATE NOT NULL` | Production date |
| `energy_kwh` | `NUMERIC(15,2) NOT NULL` | Energy generated |
| `verification_status` | `VARCHAR(20) DEFAULT 'Pending'` | Pending, Verified, Rejected |
| `submitted_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Submission timestamp |

Important constraints:

- `energy_kwh CHECK (energy_kwh > 0)`.
- `verification_status CHECK (verification_status IN ('Pending','Verified','Rejected'))`.
- `UNIQUE (plant_id, log_date)` prevents duplicate logs for the same plant and date.

Relationship:

- Many production logs belong to one energy plant.

### 5.5 `CarbonCredit`

Stores issued carbon credits.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `credit_id` | `SERIAL PRIMARY KEY` | Unique credit id |
| `company_id` | `INT NOT NULL REFERENCES Company(company_id)` | Company receiving credit |
| `log_id` | `INT NOT NULL UNIQUE REFERENCES ProductionLog(log_id)` | Source production log |
| `credits_issued` | `NUMERIC(15,4) NOT NULL` | Number of credits issued |
| `issued_date` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Issue timestamp |

Important constraints:

- `log_id UNIQUE` enforces a one-to-one relationship between a production log and carbon credit record.
- `credits_issued CHECK (credits_issued > 0)`.

Business rule:

- Credits are generated only for verified logs.
- Conversion formula: `credits = energy_kwh * 0.001`.
- This means `1 MWh = 1 carbon credit` because `1000 kWh = 1 MWh`.

### 5.6 `CreditWallet`

Stores each company's current carbon credit balance.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `wallet_id` | `SERIAL PRIMARY KEY` | Unique wallet id |
| `company_id` | `INT NOT NULL UNIQUE REFERENCES Company(company_id)` | Wallet owner |
| `balance` | `NUMERIC(15,4) DEFAULT 0` | Carbon credits currently owned |
| `last_updated` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Last update time |

Important constraints:

- `company_id UNIQUE` means one wallet per company.
- `balance CHECK (balance >= 0)` prevents negative credit balance.

Important clarification:

- This wallet stores carbon credits, not cash.
- When a company buys credits, its wallet increases by purchased credit quantity.
- When a company sells credits, its wallet decreases by sold credit quantity.
- Price and total amount are monetary/reporting fields and do not affect `CreditWallet.balance`.

### 5.7 `MarketListing`

Stores credits listed for sale.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `listing_id` | `SERIAL PRIMARY KEY` | Unique listing id |
| `seller_id` | `INT NOT NULL REFERENCES Company(company_id)` | Seller company |
| `credit_id` | `INT NOT NULL REFERENCES CarbonCredit(credit_id)` | Credit record being listed |
| `quantity` | `NUMERIC(15,4) NOT NULL` | Available quantity in listing |
| `price_per_credit` | `NUMERIC(15,4) NOT NULL` | Monetary price per credit |
| `status` | `VARCHAR(20) DEFAULT 'Active'` | Active, Sold, Cancelled |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Listing creation time |

Important constraints:

- `chk_marketlisting_quantity_status`:
  active listings must have `quantity > 0`; sold or cancelled listings may have `quantity >= 0`.
- `price_per_credit CHECK (price_per_credit > 0)`.
- `status CHECK (status IN ('Active','Sold','Cancelled'))`.

Business rules enforced in service/procedure:

- A company can list only its own credits.
- A listing cannot exceed available unsold/unlisted credit quantity.
- A sold or cancelled listing cannot be purchased.

### 5.8 `Transaction`

Stores completed marketplace purchases.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `txn_id` | `SERIAL PRIMARY KEY` | Unique transaction id |
| `listing_id` | `INT NOT NULL REFERENCES MarketListing(listing_id)` | Listing purchased from |
| `buyer_id` | `INT NOT NULL REFERENCES Company(company_id)` | Buyer company |
| `quantity` | `NUMERIC(15,4) NOT NULL` | Credits purchased |
| `total_amount` | `NUMERIC(15,4) NOT NULL` | `quantity * price_per_credit` |
| `txn_date` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Transaction timestamp |

Important constraints:

- `quantity CHECK (quantity > 0)`.
- `total_amount CHECK (total_amount > 0)`.

Important clarification:

- `total_amount` is monetary/reporting value.
- `CreditWallet` is updated by credit quantity, not `total_amount`.

### 5.9 `ComplianceReport`

Stores compliance reports generated by companies and audited by authorities.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `report_id` | `SERIAL PRIMARY KEY` | Unique report id |
| `company_id` | `INT NOT NULL REFERENCES Company(company_id)` | Reporting company |
| `authority_id` | `INT NOT NULL REFERENCES RegulatoryAuthority(authority_id)` | Authority receiving report |
| `report_date` | `DATE DEFAULT CURRENT_DATE` | Report date |
| `total_credits_issued` | `NUMERIC(15,4)` | Total issued credits |
| `total_credits_traded` | `NUMERIC(15,4)` | Total traded credits |
| `status` | `VARCHAR(20) DEFAULT 'Draft'` | Draft, Submitted, Audited |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

Important constraints:

- `status CHECK (status IN ('Draft','Submitted','Audited'))`.

Business rule:

- A company generates/submits a report.
- Regulatory authority audits it by changing status to `Audited`.

### 5.10 `Users`

Stores login users.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `user_id` | `SERIAL PRIMARY KEY` | Unique user id |
| `username` | `VARCHAR(100) UNIQUE NOT NULL` | Login username |
| `password_hash` | `VARCHAR(255) NOT NULL` | bcrypt password hash |
| `role` | `VARCHAR(30) NOT NULL` | User role |
| `company_id` | `INT REFERENCES Company(company_id)` | Linked company for company admin |
| `authority_id` | `INT REFERENCES RegulatoryAuthority(authority_id)` | Linked authority for regulatory authority |
| `created_at` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

Roles:

| Role | Meaning |
| --- | --- |
| `company_admin` | Company-side user |
| `regulatory_authority` | Authority-side user |
| `marketplace_admin` | Platform admin |

Important constraints:

- `username UNIQUE`.
- `role CHECK (role IN (...))`.
- `company_admin` must have `company_id` and no `authority_id`.
- `regulatory_authority` must have `authority_id` and no `company_id`.
- `marketplace_admin` must have neither `company_id` nor `authority_id`.

### 5.11 `PlantVerificationLog`

Stores audit trail for plant and production log decisions.

Columns:

| Column | Type | Meaning |
| --- | --- | --- |
| `verification_id` | `SERIAL PRIMARY KEY` | Unique audit id |
| `plant_id` | `INT NOT NULL REFERENCES EnergyPlant(plant_id)` | Related plant |
| `authority_id` | `INT NOT NULL REFERENCES RegulatoryAuthority(authority_id)` | Authority making decision |
| `action` | `VARCHAR(50) NOT NULL` | Approved, Rejected, LOG_Verified, LOG_Rejected |
| `action_date` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | Decision timestamp |
| `remarks` | `TEXT` | Remarks |

Use:

- Keeps historical record of regulatory actions.
- Useful for audit trail and presentation.

## 6. Custom Composite Types

Two composite types are created for cursor-based functions.

### 6.1 `compliance_summary_record`

Fields:

- `company_name`
- `total_issued`
- `total_traded`
- `compliance_ratio`

Used by:

- `generate_periodic_compliance_summary(authority_id)`

### 6.2 `active_listing_record`

Fields:

- `listing_id`
- `seller_name`
- `credits_available`
- `price_per_credit`
- `total_value`

Used by:

- `get_active_listings_cursor()`

## 7. Normalization Explanation

The schema is designed in 3NF.

### First Normal Form

All columns store atomic values. There are no repeating groups or arrays.

Example:

- Company details are separate rows in `Company`.
- Production logs are separate rows in `ProductionLog`.

### Second Normal Form

All non-key attributes depend on the whole primary key. Since tables use single-column surrogate primary keys, non-key attributes depend on that key.

Example:

- `EnergyPlant.name`, `type`, `capacity`, and `location` depend on `plant_id`.

### Third Normal Form

There are no transitive dependencies.

Example:

- `ProductionLog` stores `plant_id`, not `company_name`.
- `CarbonCredit` stores `company_id`, not company details.
- `MarketListing` stores `seller_id`, not seller name.
- Names are fetched through joins.

## 8. Constraints and Data Integrity

The project uses several constraint types:

### Primary Keys

Every table has a primary key:

- `company_id`
- `authority_id`
- `plant_id`
- `log_id`
- `credit_id`
- `wallet_id`
- `listing_id`
- `txn_id`
- `report_id`
- `user_id`
- `verification_id`

### Foreign Keys

Foreign keys enforce relationships:

- `EnergyPlant.company_id -> Company.company_id`
- `ProductionLog.plant_id -> EnergyPlant.plant_id`
- `CarbonCredit.log_id -> ProductionLog.log_id`
- `CarbonCredit.company_id -> Company.company_id`
- `CreditWallet.company_id -> Company.company_id`
- `MarketListing.seller_id -> Company.company_id`
- `MarketListing.credit_id -> CarbonCredit.credit_id`
- `Transaction.listing_id -> MarketListing.listing_id`
- `Transaction.buyer_id -> Company.company_id`
- `ComplianceReport.company_id -> Company.company_id`
- `ComplianceReport.authority_id -> RegulatoryAuthority.authority_id`
- `PlantVerificationLog.plant_id -> EnergyPlant.plant_id`
- `PlantVerificationLog.authority_id -> RegulatoryAuthority.authority_id`

### Unique Constraints

- `Company.registration_no` is unique.
- `Users.username` is unique.
- `CarbonCredit.log_id` is unique to prevent duplicate credit issuance.
- `CreditWallet.company_id` is unique to enforce one wallet per company.
- `ProductionLog(plant_id, log_date)` is unique to prevent duplicate daily logs.

### Check Constraints

Examples:

- `EnergyPlant.type` must be Solar, Wind, Hydro, or Biomass.
- `EnergyPlant.status` must be Pending, Approved, or Rejected.
- `ProductionLog.energy_kwh > 0`.
- `ProductionLog.verification_status` must be Pending, Verified, or Rejected.
- `CarbonCredit.credits_issued > 0`.
- `CreditWallet.balance >= 0`.
- `MarketListing.quantity > 0` while active; sold or cancelled listings can have `quantity >= 0`.
- `MarketListing.price_per_credit > 0`.
- `MarketListing.status` must be Active, Sold, or Cancelled.
- `Transaction.quantity > 0`.
- `Transaction.total_amount > 0`.
- `ComplianceReport.status` must be Draft, Submitted, or Audited.
- `Users.role` and role-specific ids are validated.

## 9. Indexes

Indexes are created for performance, especially on foreign keys and frequently filtered columns.

### Why Indexes Are Used

Indexes speed up:

- joins
- filtering
- sorting
- lookup by foreign key
- dashboard/report queries

### Main Indexes

`EnergyPlant`:

- `company_id`
- `status`
- `type`

`ProductionLog`:

- `plant_id`
- `verification_status`
- `log_date`
- `submitted_at`

`CarbonCredit`:

- `company_id`
- `log_id`
- `issued_date`

`CreditWallet`:

- `company_id`

`MarketListing`:

- `seller_id`
- `credit_id`
- `status`
- `created_at`
- composite index `(status, created_at DESC)`

`Transaction`:

- `listing_id`
- `buyer_id`
- `txn_date`

`ComplianceReport`:

- `company_id`
- `authority_id`
- `status`
- `report_date`

`Users`:

- `company_id`
- `authority_id`
- `role`

`PlantVerificationLog`:

- `plant_id`
- `authority_id`
- `action_date`

## 10. Views

Views are saved SQL queries. They simplify analytics and reporting.

### 10.1 `active_listings_view`

Purpose:

- Shows active marketplace listings with seller details and total value.

Tables used:

- `MarketListing`
- `Company`
- `CarbonCredit`

Important columns:

- `listing_id`
- `seller_id`
- `seller_name`
- `seller_reg_no`
- `credit_id`
- `original_credits`
- `credits_available`
- `price_per_credit`
- `total_value`
- `status`
- `created_at`

SQL concepts:

- `JOIN`
- calculated column: `ml.quantity * ml.price_per_credit AS total_value`
- filter: `WHERE ml.status = 'Active'`

### 10.2 `compliance_summary_view`

Purpose:

- Summarizes compliance reports per company.

Tables used:

- `ComplianceReport`
- `Company`

Aggregates:

- `SUM(total_credits_issued)`
- `SUM(total_credits_traded)`
- `COUNT(report_id)`
- `compliance_ratio = total_traded / total_issued`

Important SQL:

- `NULLIF(SUM(...), 0)` prevents division by zero.

### 10.3 `credit_issuance_trends_view`

Purpose:

- Monthly credit issuance analytics.

Tables used:

- `CarbonCredit`
- `Company`

Important SQL:

- `DATE_TRUNC('month', cc.issued_date)` groups credits by month.
- `COUNT(cc.credit_id)` counts credit records.
- `SUM(cc.credits_issued)` totals issued credits.
- Groups by month and industry.

### 10.4 `marketplace_volume_view`

Purpose:

- Monthly marketplace volume reporting.

Tables used:

- `Transaction`

Aggregates:

- transaction count
- total credits traded
- total monetary volume
- total fees collected at 2%

Important clarification:

- `total_volume` is monetary trade value, not carbon credit wallet balance.

### 10.5 `company_performance_view`

Purpose:

- Shows company-level performance.

Tables used:

- `Company`
- `CarbonCredit`
- `CreditWallet`
- `EnergyPlant`
- subqueries over `Transaction` and `MarketListing`

Metrics:

- total issued credits
- total sold credits
- total bought credits
- wallet balance
- plant count

Important SQL:

- `LEFT JOIN` includes companies even if some related data is missing.
- `COALESCE(..., 0)` converts null aggregates to zero.
- Subqueries separately calculate sold and bought credits.

### 10.6 `top_buyers_view`

Purpose:

- Ranks buyers by purchased credit quantity.

Tables used:

- `Transaction`
- `Company`

Important SQL:

- `RANK() OVER (ORDER BY SUM(t.quantity) DESC)` is a window function.
- It ranks companies by total credits purchased.

## 11. PL/pgSQL Functions

Functions return a value and can be called inside SQL queries, procedures, or triggers.

### 11.1 `calculate_carbon_credits(p_log_id INT)`

Purpose:

- Converts energy production to carbon credits.

Logic:

1. Fetch `energy_kwh` from `ProductionLog`.
2. If log does not exist, raise `LOG_NOT_FOUND`.
3. Return `ROUND(energy_kwh * 0.001, 4)`.

Formula:

```sql
credits = energy_kwh * 0.001
```

Example:

- 50,000 kWh = 50 credits.

SQL concepts:

- `SELECT ... INTO`
- `IF NOT FOUND`
- `RAISE EXCEPTION`
- `ROUND`

### 11.2 `get_company_wallet_balance(p_company_id INT)`

Purpose:

- Returns a company's credit wallet balance.

Logic:

1. Fetch `balance` from `CreditWallet`.
2. If wallet not found, raise `WALLET_NOT_FOUND`.
3. Return balance.

### 11.3 `calculate_marketplace_fee(p_total_amount NUMERIC)`

Purpose:

- Returns 2% platform fee for monetary trade reporting.

Logic:

```sql
RETURN ROUND(p_total_amount * 0.02, 4);
```

Current use:

- Used for reporting/analytics, not for credit wallet deduction.

### 11.4 `generate_carbon_credits(p_log_id INT)`

Purpose:

- Issues carbon credits for a verified production log.

Logic:

1. Fetch production log status and company through `ProductionLog JOIN EnergyPlant`.
2. If log does not exist, raise `LOG_NOT_FOUND`.
3. If log is not `Verified`, raise `LOG_NOT_VERIFIED`.
4. Check whether a credit already exists for the log.
5. If credit exists, raise `DUPLICATE_CREDIT_ISSUANCE`.
6. Calculate credits by calling `calculate_carbon_credits`.
7. Insert into `CarbonCredit`.
8. Add credits to `CreditWallet`.
9. If wallet does not exist, create it as fallback.

Important SQL concepts:

- `JOIN`
- `SELECT ... INTO`
- `IF FOUND`
- function calling another function
- exception raising
- update with fallback insert

## 12. Stored Procedures

Stored procedures perform workflow operations. They are called from the backend using `CALL procedure_name(...)`.

Important note:

- These procedures do not use internal `COMMIT` or `ROLLBACK`.
- The API call executes the `CALL` as a single SQL statement, so PostgreSQL rolls back the statement if an exception occurs.

### 12.1 `verify_production_log(p_log_id, p_authority_id, p_decision, p_remarks)`

Purpose:

- Regulatory authority verifies or rejects a production log.

Allowed decisions:

- `Verified`
- `Rejected`

Logic:

1. Validate decision.
2. Fetch production log's plant and current status.
3. If log does not exist, raise error.
4. If log is not pending, prevent re-verification.
5. Update `ProductionLog.verification_status`.
6. Insert audit row into `PlantVerificationLog`.
7. If decision is `Verified`, call `generate_carbon_credits`.
8. Duplicate credit issuance is ignored only when caused by trigger/procedure double call.

Why duplicate is caught:

- Updating `ProductionLog` to `Verified` fires `trg_auto_issue_credits`.
- Procedure also explicitly calls `generate_carbon_credits`.
- If trigger already issued credits, the procedure catches only duplicate issuance and ignores it.

### 12.2 `execute_credit_purchase(p_listing_id, p_buyer_id, p_quantity)`

Purpose:

- Executes a marketplace credit transfer.

Logic:

1. Lock the marketplace listing using `SELECT ... FOR UPDATE`.
2. Validate listing exists.
3. Validate listing status is `Active`.
4. Validate listing has enough quantity.
5. Prevent self-purchase.
6. Calculate monetary `total_amount = quantity * price_per_credit`.
7. Lock buyer and seller credit wallets using `FOR UPDATE`.
8. Validate both wallets exist.
9. Validate seller wallet has enough credits.
10. Insert row into `Transaction`.
11. Add `p_quantity` to buyer wallet.
12. Subtract `p_quantity` from seller wallet.
13. Reduce listing quantity.
14. If listing quantity becomes zero, mark listing as `Sold`. The listing constraint allows this zero quantity only because the status is no longer `Active`.

Important concepts:

- `SELECT ... FOR UPDATE` prevents race conditions.
- The wallet stores carbon credits, not money.
- `total_amount` is only reporting value.
- Trigger `trg_prevent_negative_wallet` also prevents negative wallet balances.

### 12.3 `generate_compliance_report(p_company_id, p_authority_id)`

Purpose:

- Generates a compliance report for a company and authority.

Logic:

1. Validate company exists.
2. Validate authority exists.
3. Open cursor over all carbon credits issued to the company.
4. Sum credits issued.
5. Open cursor over all transactions where company is buyer or seller.
6. Sum traded quantity.
7. Insert row into `ComplianceReport` with status `Submitted`.

Important SQL concepts:

- explicit cursors
- cursor loops
- aggregation through procedural iteration
- insert generated report

### 12.4 `approve_energy_plant(p_plant_id, p_authority_id, p_decision, p_remarks)`

Purpose:

- Regulatory authority approves or rejects an energy plant.

Allowed decisions:

- `Approved`
- `Rejected`

Logic:

1. Validate decision.
2. Fetch current plant status.
3. If plant does not exist, raise error.
4. Update `EnergyPlant.status`.
5. Insert audit record into `PlantVerificationLog`.

## 13. Triggers

Triggers automatically run when table events occur.

### 13.1 `trg_auto_create_wallet`

Event:

- `AFTER INSERT ON Company`

Function:

- `trg_auto_create_wallet_fn`

Purpose:

- Automatically creates a credit wallet for every new company.

Logic:

```sql
INSERT INTO CreditWallet (company_id, balance)
VALUES (NEW.company_id, 0)
ON CONFLICT (company_id) DO NOTHING;
```

Why useful:

- Prevents missing wallet records.
- Makes company registration automatic and consistent.

### 13.2 `trg_prevent_duplicate_credit`

Event:

- `BEFORE INSERT ON CarbonCredit`

Function:

- `trg_prevent_duplicate_credit_fn`

Purpose:

- Prevents issuing credits twice for the same production log.

Logic:

1. Check whether `CarbonCredit` already exists for `NEW.log_id`.
2. If found, raise `DUPLICATE_CREDIT_ISSUANCE`.

This is a second layer of protection in addition to:

- `CarbonCredit.log_id UNIQUE`
- check in `generate_carbon_credits`

### 13.3 `trg_auto_issue_credits`

Event:

- `AFTER UPDATE ON ProductionLog`

Function:

- `trg_auto_issue_credits_fn`

Purpose:

- Automatically generates credits when a production log becomes `Verified`.

Logic:

1. Check status transition to `Verified`.
2. Call `generate_carbon_credits(NEW.log_id)`.
3. Ignore duplicate issuance if procedure also issued it.
4. Re-raise all other errors.

Important SQL:

- `OLD.verification_status IS DISTINCT FROM 'Verified'` checks actual transition.

### 13.4 `trg_prevent_negative_wallet`

Event:

- `BEFORE UPDATE ON CreditWallet`

Function:

- `trg_prevent_negative_wallet_fn`

Purpose:

- Prevents any credit wallet from becoming negative.

Logic:

```sql
IF NEW.balance < 0 THEN
    RAISE EXCEPTION ...
END IF;
```

### 13.5 `trg_update_wallet_after_transaction`

Event:

- `AFTER INSERT ON Transaction`

Function:

- `trg_update_wallet_after_transaction_fn`

Purpose:

- Validates final wallet state after transaction insertion.

Logic:

1. Resolve seller from listing.
2. Fetch buyer wallet balance.
3. Ensure buyer wallet is not negative.
4. Fetch seller wallet balance.
5. Ensure seller wallet is not negative.

Important note:

- Main wallet transfer happens in `execute_credit_purchase`.
- This trigger is a safety/integrity validator.

## 14. Cursor-Based Functions

Cursor functions are included because the project demonstrates explicit cursor usage.

### 14.1 `generate_periodic_compliance_summary(p_authority_id)`

Returns:

- `SETOF compliance_summary_record`

Purpose:

- Generates compliance summary for companies under a given authority.

Logic:

1. Declare cursor for companies that have reports with this authority.
2. Open cursor.
3. Fetch one company at a time.
4. For each company, aggregate issued and traded credits from `ComplianceReport`.
5. Fill composite result.
6. `RETURN NEXT` each row.
7. Close cursor.

Important SQL concepts:

- cursor declaration
- `OPEN`
- `FETCH`
- `EXIT WHEN NOT FOUND`
- `RETURN NEXT`
- `CLOSE`
- composite return type

### 14.2 `get_active_listings_cursor()`

Returns:

- `SETOF active_listing_record`

Purpose:

- Returns active marketplace listings using an explicit cursor.

Logic:

1. Cursor selects active listings joined with seller company.
2. Loop through rows.
3. Calculate total value.
4. Return each row.

## 15. Seed Data

The seed file inserts sample data for all tables.

### Why Triggers Are Disabled During Seeding

The seed file directly inserts records into many tables. Some triggers would automatically create or validate rows and interfere with controlled seed data.

Disabled triggers:

- wallet auto-create
- duplicate credit prevention
- auto credit issue
- transaction wallet validation
- negative wallet prevention

They are re-enabled at the end.

### Seeded Data

| Table | Records | Notes |
| --- | ---: | --- |
| `RegulatoryAuthority` | 2 | MNRE and CERC |
| `Company` | 5 | Renewable energy companies |
| `CreditWallet` | 5 | One per company |
| `EnergyPlant` | 6 | Approved, pending, rejected plants |
| `ProductionLog` | 8 | Verified, pending, rejected logs |
| `CarbonCredit` | 6 | Only verified logs |
| `MarketListing` | 6 | Active, sold, cancelled listings |
| `Transaction` | 8 | Completed trades |
| `PlantVerificationLog` | 13 | Plant and log audit events |
| `ComplianceReport` | 4 | Submitted, audited, draft |
| `Users` | 3 | One per role |

### Sequence Reset

After manual inserts with explicit ids, sequences are reset using:

```sql
SELECT setval('sequence_name', (SELECT MAX(id_column) FROM TableName));
```

Why:

- Without resetting sequences, the next auto-generated `SERIAL` id could conflict with seeded ids.

## 16. Main Workflows in SQL Terms

### 16.1 Company Registration

1. Insert into `Company`.
2. Trigger `trg_auto_create_wallet` automatically inserts into `CreditWallet`.
3. Backend also creates a linked `Users` row with role `company_admin`.

### 16.2 Plant Approval

1. Regulatory authority calls `approve_energy_plant`.
2. Procedure validates decision.
3. Updates `EnergyPlant.status`.
4. Inserts row into `PlantVerificationLog`.

### 16.3 Production Log Verification and Credit Issuance

1. Company submits `ProductionLog`.
2. Regulatory authority calls `verify_production_log`.
3. Procedure updates `verification_status`.
4. Trigger may call `generate_carbon_credits`.
5. Procedure also calls `generate_carbon_credits`.
6. Duplicate issuance is safely ignored.
7. `CarbonCredit` row is inserted.
8. `CreditWallet.balance` increases.
9. Audit row is inserted.

### 16.4 Marketplace Purchase

1. Buyer calls `execute_credit_purchase`.
2. Procedure locks listing row.
3. Checks listing status and quantity.
4. Prevents self-purchase.
5. Locks buyer and seller wallets.
6. Validates seller has enough credits.
7. Inserts transaction.
8. Buyer wallet increases by purchased credit quantity.
9. Seller wallet decreases by sold credit quantity.
10. Listing quantity decreases.
11. Listing status changes to `Sold` if exhausted.

### 16.5 Compliance Report Generation

1. Company calls `generate_compliance_report`.
2. Procedure uses cursors to total issued credits.
3. Procedure uses cursors to total traded credits.
4. Inserts `ComplianceReport` with status `Submitted`.
5. Regulatory authority can audit it.

## 17. ACID Properties in the Project

### Atomicity

Procedure calls behave atomically as a single SQL statement. If an exception occurs, PostgreSQL rolls back changes from that statement.

Example:

- During purchase, if wallet update fails after transaction insert, the whole procedure call fails and does not partially apply.

### Consistency

Constraints, triggers, and procedures keep data valid.

Examples:

- Wallet cannot go negative.
- Duplicate carbon credit issuance is blocked.
- Only valid statuses are allowed.
- Foreign keys prevent orphan records.

### Isolation

`SELECT ... FOR UPDATE` locks rows during purchase.

Example:

- Two buyers cannot simultaneously buy the same listing quantity incorrectly.

### Durability

Once PostgreSQL commits a successful transaction, data persists.

## 18. Important SQL Commands Used

| SQL Feature | Where Used | Purpose |
| --- | --- | --- |
| `CREATE TABLE` | migrations | Define schema |
| `PRIMARY KEY` | all tables | Unique row identity |
| `FOREIGN KEY` | relationships | Referential integrity |
| `UNIQUE` | registration no, username, wallet, log credit | Prevent duplicates |
| `CHECK` | status, positive numeric values | Domain validation |
| `DEFAULT` | timestamps, statuses | Automatic values |
| `SERIAL` | ids | Auto-incrementing primary keys |
| `CREATE INDEX` | migration 002 | Faster lookups |
| `CREATE VIEW` | migration 003 | Saved reporting queries |
| `JOIN` | views/functions/services | Combine related tables |
| `LEFT JOIN` | reports | Include missing related rows |
| `GROUP BY` | views | Aggregation |
| `SUM`, `COUNT` | views/procedures | Analytics |
| `COALESCE` | views | Replace null with zero |
| `NULLIF` | compliance ratio | Avoid division by zero |
| `DATE_TRUNC` | trend views | Monthly grouping |
| `RANK() OVER` | top buyers view | Ranking |
| `CREATE FUNCTION` | functions/triggers/cursors | Reusable logic |
| `CREATE PROCEDURE` | workflows | Multi-step operations |
| `CALL` | backend | Execute procedure |
| `CREATE TRIGGER` | triggers | Automatic behavior |
| `NEW`, `OLD` | triggers | Access changed rows |
| `RAISE EXCEPTION` | functions/procedures/triggers | Custom errors |
| `SELECT ... INTO` | PL/pgSQL | Store query result in variable |
| `IF FOUND`, `IF NOT FOUND` | PL/pgSQL | Existence checks |
| `FOR UPDATE` | purchase procedure | Row-level locking |
| `CURSOR` | cursor functions/procedure | Row-by-row iteration |
| `RETURN NEXT` | cursor functions | Return set rows |
| `setval` | seed file | Reset sequences |

## 19. Roles and Database Access Meaning

### Company Admin

Can:

- Register plants.
- Submit production logs.
- View own credits and wallet.
- Create listings.
- Buy credits.
- Generate compliance reports.

Cannot:

- Approve plants.
- Verify logs.
- Audit compliance reports.
- Cancel other companies' listings.

### Regulatory Authority

Can:

- Approve/reject plants.
- Verify/reject production logs.
- Trigger credit issuance through verification.
- Audit compliance reports.
- View regulatory analytics.

Cannot:

- Buy/sell credits.
- Submit company production logs.
- Access company wallets.

### Marketplace Admin

Can:

- View marketplace-wide records.
- View all listings and transactions.
- Cancel active marketplace listings.
- View analytics.
- Create users through protected endpoint.

Cannot:

- Verify production logs.
- Issue credits directly.
- Buy/sell as a company.

## 20. Common Viva Questions and Answers

### Q1. Why did you use separate `Company` and `Users` tables?

`Company` stores business entity data. `Users` stores authentication and role data. Keeping them separate avoids repeating company details for login users and supports different roles like company admin, regulatory authority, and marketplace admin.

### Q2. Why is `CreditWallet.company_id` unique?

Each company should have exactly one carbon credit wallet. `UNIQUE(company_id)` prevents multiple wallets for the same company.

### Q3. Why is `CarbonCredit.log_id` unique?

One production log should generate credits only once. `UNIQUE(log_id)` enforces a one-to-one relationship between `ProductionLog` and `CarbonCredit`.

### Q4. How are carbon credits calculated?

The function `calculate_carbon_credits(log_id)` fetches `energy_kwh` and returns `energy_kwh * 0.001`. This means `1 MWh = 1 credit`.

### Q5. What prevents duplicate credit issuance?

Three layers:

1. `CarbonCredit.log_id UNIQUE`.
2. `generate_carbon_credits` checks whether credit already exists.
3. `trg_prevent_duplicate_credit` blocks duplicate insert.

### Q6. What is the role of triggers?

Triggers automate database behavior:

- create wallet after company insert
- prevent duplicate credits
- auto-issue credits when log is verified
- prevent negative wallet
- validate wallet state after transaction

### Q7. Why use stored procedures?

Stored procedures keep important business workflows inside the database. For example, `execute_credit_purchase` performs locking, validation, transaction insertion, wallet transfer, and listing update in one atomic operation.

### Q8. What is `SELECT ... FOR UPDATE` used for?

It locks selected rows during a transaction. In `execute_credit_purchase`, it prevents two users from buying the same listing quantity at the same time and causing inconsistent data.

### Q9. What is the difference between function and procedure?

A function returns a value and can be used inside SQL expressions or triggers. A procedure is called with `CALL` and is used for workflow operations. In this project, credit calculation is a function, while purchase execution is a procedure.

### Q10. What is a cursor?

A cursor processes query results row by row. This project uses cursors in compliance summary functions and compliance report generation to demonstrate procedural SQL logic.

### Q11. Why use views?

Views simplify complex queries and provide reusable reporting layers. For example, `top_buyers_view` calculates buyer rankings and can be queried directly by the backend.

### Q12. How is 3NF achieved?

Data is separated by entity. Company data is in `Company`, plant data in `EnergyPlant`, logs in `ProductionLog`, credits in `CarbonCredit`, etc. Non-key fields depend only on their table key, and transitive dependencies are avoided.

### Q13. How is referential integrity maintained?

Through foreign keys. For example, a production log cannot reference a non-existing plant, and a listing cannot reference a non-existing credit.

### Q14. How is the audit trail maintained?

`PlantVerificationLog` records plant approvals/rejections and production log verification/rejection actions with authority id, date, and remarks.

### Q15. What happens when a production log is verified?

The log status changes to `Verified`, audit record is inserted, carbon credits are generated, and the company's wallet balance increases by the issued credits.

### Q16. What happens when credits are bought?

The purchase procedure inserts a transaction, increases buyer's credit wallet by purchased quantity, decreases seller's credit wallet by sold quantity, and reduces listing quantity.

### Q17. Are carbon credits bought using carbon credits?

No. The wallet stores only carbon credits. `price_per_credit` and `total_amount` are monetary/reporting values. They do not reduce the buyer's credit wallet. The credit transfer is quantity-based.

### Q18. Why is `total_amount` stored in `Transaction`?

It records the monetary value of the trade at the time of purchase. This is useful for reports, market volume, and fee analytics.

### Q19. How are marketplace fees calculated?

The function `calculate_marketplace_fee(total_amount)` returns 2% of monetary trade value. It is used for reporting. It does not change carbon credit wallet balance.

### Q20. What prevents negative wallet balances?

Two layers:

1. `CreditWallet.balance CHECK (balance >= 0)`.
2. `trg_prevent_negative_wallet` raises an exception before negative updates.

### Q21. Why are triggers disabled in seed file?

During seeding, data is inserted manually in a controlled order. Triggers are disabled to avoid automatic inserts or validations interfering with seed data. They are re-enabled after seeding.

### Q22. Why reset sequences after seeding?

Seed data uses explicit primary key ids. `setval` updates the `SERIAL` sequence so future inserts use ids greater than existing max ids.

### Q23. Why use `COALESCE`?

Aggregates like `SUM` return `NULL` when there are no matching rows. `COALESCE(value, 0)` converts null to zero for correct reports.

### Q24. Why use `NULLIF` in compliance ratio?

`NULLIF(total_issued, 0)` prevents division by zero. If total issued is zero, compliance ratio becomes null instead of causing an error.

### Q25. Why use `ON DELETE CASCADE` for plants/logs?

If a company is deleted, its plants should not remain orphaned. If a plant is deleted, its production logs should not remain orphaned.

### Q26. How does the project handle invalid business operations?

It raises custom exceptions such as:

- `LOG_NOT_FOUND`
- `LOG_NOT_VERIFIED`
- `DUPLICATE_CREDIT_ISSUANCE`
- `WALLET_NOT_FOUND`
- `LISTING_NOT_ACTIVE`
- `INSUFFICIENT_QUANTITY`
- `SELF_PURCHASE_NOT_ALLOWED`
- `INSUFFICIENT_WALLET_BALANCE`

The backend maps these database errors to API responses.

### Q27. Why is `MarketListing.status` needed?

It tracks listing lifecycle:

- `Active`: available for purchase
- `Sold`: exhausted
- `Cancelled`: removed by seller/admin

### Q28. Why not delete sold/cancelled listings?

Keeping them preserves transaction history and auditability. Deleting listings would break historical marketplace records.

### Q29. Why does `ComplianceReport` store totals instead of calculating every time?

It acts as a snapshot at report generation time. Historical reports should not change if later transactions occur.

### Q30. What is the most important database workflow?

The purchase workflow is the most transaction-sensitive because it changes listing quantity, transaction records, and two wallets. It uses row locks and validations to maintain consistency.

## 21. Important Joins to Explain

### Production log with company

```sql
SELECT pl.*, ep.name AS plant_name, c.name AS company_name
FROM ProductionLog pl
JOIN EnergyPlant ep ON pl.plant_id = ep.plant_id
JOIN Company c ON ep.company_id = c.company_id;
```

Why:

- Production log has only `plant_id`.
- Plant has `company_id`.
- Company has name.

### Listing with seller

```sql
SELECT ml.*, c.name AS seller_name
FROM MarketListing ml
JOIN Company c ON ml.seller_id = c.company_id;
```

Why:

- Listings store seller id.
- Seller name comes from `Company`.

### Transaction with buyer and seller

```sql
SELECT t.*, buyer.name AS buyer_name, seller.name AS seller_name
FROM Transaction t
JOIN Company buyer ON t.buyer_id = buyer.company_id
JOIN MarketListing ml ON t.listing_id = ml.listing_id
JOIN Company seller ON ml.seller_id = seller.company_id;
```

Why:

- Transaction directly stores buyer.
- Seller is derived through the listing.

## 22. Things to Emphasize During Presentation

Emphasize these points:

1. The database is normalized to 3NF.
2. Foreign keys maintain referential integrity.
3. Check constraints enforce valid domains and positive numeric values.
4. Triggers automate wallet creation and credit issuance.
5. Stored procedures implement important workflows atomically.
6. `SELECT ... FOR UPDATE` handles concurrency during purchase.
7. Cursors are used for compliance summaries and reports.
8. Views simplify analytics.
9. Audit logs preserve regulatory decisions.
10. Carbon credit wallet stores credits only, not money.

## 23. Short Presentation Script

You can explain the SQL design like this:

> The database models renewable energy companies, regulatory authorities, plants, production logs, issued carbon credits, wallets, listings, transactions, and compliance reports. The schema is normalized to 3NF, so entity data is separated and connected using foreign keys. Constraints enforce valid statuses, positive quantities, unique users, unique company registrations, and one credit issuance per production log.
>
> The project uses PL/pgSQL functions for reusable calculations, such as converting kWh to carbon credits. Stored procedures perform important workflows like verifying production logs, approving plants, executing purchases, and generating compliance reports. Triggers automate wallet creation, prevent duplicate credits, automatically issue credits after log verification, and prevent negative wallet balances.
>
> For analytics, the project uses SQL views like active listings, compliance summaries, credit issuance trends, marketplace volume, company performance, and top buyers. Cursor-based functions demonstrate row-by-row processing for compliance summaries. The marketplace purchase procedure uses row-level locking with `FOR UPDATE` to avoid race conditions and maintain ACID consistency.

## 24. Quick Revision Checklist

Before viva, revise:

- All table names and their purpose.
- Primary keys and major foreign keys.
- Why `CarbonCredit.log_id` is unique.
- Why `CreditWallet.company_id` is unique.
- Carbon credit formula.
- Difference between function, procedure, trigger, and view.
- Purchase workflow.
- Log verification workflow.
- Trigger names and purposes.
- Cursor functions.
- How ACID is handled.
- Why wallet stores credits, not money.
