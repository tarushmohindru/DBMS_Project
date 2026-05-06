# Renewable Energy Trading & Carbon Credit Marketplace

**DBMS Course Project — Even Sem 2025-26 | Batch 2Q24**
*Submitted to: Mr. Deepak Sharma*

---

## System Architecture

```
carbon-credit-marketplace/
├── backend/                    # Node.js + Express + TypeScript API (port 3001)
│   └── src/
│       ├── config/db.ts        # PostgreSQL connection pool (pg)
│       ├── middleware/auth.ts  # JWT verification + RBAC
│       ├── controllers/        # HTTP request handlers (10 files)
│       ├── routes/             # Express routers (10 files + index)
│       ├── services/           # Business logic (10 files + error mapper)
│       ├── validators/         # Zod schemas (7 files)
│       └── db/
│           ├── migrations/
│           │   ├── 001_create_tables.sql   # All DDL — 3NF schema
│           │   ├── 002_create_indexes.sql  # FK + query indexes
│           │   └── 003_create_views.sql    # 5 analytical views
│           ├── seeds/
│           │   └── seed.sql               # Realistic sample data
│           └── procedures/
│               ├── functions.sql          # 4 PL/pgSQL functions
│               ├── procedures.sql         # 4 stored procedures (COMMIT/ROLLBACK)
│               ├── triggers.sql           # 5 triggers
│               └── cursors.sql            # 2 cursor-based SETOF functions
└── frontend/                   # Next.js 14 + TypeScript + Tailwind (port 3000)
    └── src/
        ├── context/            # AuthContext (JWT + role state)
        ├── hooks/              # useAuth, useWallet, useListings
        ├── components/         # Layout, Navbar, KPICard, DataTable, Modal, Badge
        ├── pages/              # 10 dashboard pages
        ├── services/           # Axios API wrappers
        └── types/              # TypeScript interfaces
```

---

## Database Design (3NF Normalized)

### Tables

| Table               | Primary Key    | Key Constraints                         |
|---------------------|----------------|------------------------------------------|
| Company             | company_id     | registration_no UNIQUE NOT NULL          |
| RegulatoryAuthority | authority_id   | —                                        |
| EnergyPlant         | plant_id       | FK→Company, type CHECK, status CHECK     |
| ProductionLog       | log_id         | FK→EnergyPlant, energy_kwh > 0          |
| CarbonCredit        | credit_id      | log_id UNIQUE (1:1 with ProductionLog)  |
| CreditWallet        | wallet_id      | company_id UNIQUE, balance >= 0          |
| MarketListing       | listing_id     | FK→Company, FK→CarbonCredit, qty > 0    |
| Transaction         | txn_id         | FK→MarketListing, FK→Company (buyer)    |
| ComplianceReport    | report_id      | FK→Company, FK→RegulatoryAuthority      |
| Users               | user_id        | username UNIQUE, role CHECK             |
| PlantVerificationLog| verification_id| FK→EnergyPlant, FK→RegulatoryAuthority  |

### Normalization (3NF Proof)
- **1NF**: All columns atomic; no repeating groups; every table has a primary key
- **2NF**: All non-key attributes fully depend on the complete primary key (no partial dependencies since all PKs are single-column serials)
- **3NF**: No transitive dependencies — e.g., `company_id → company_name` is in Company table; `plant_id → plant_type` is in EnergyPlant; there is no X→Y→Z chain within any table

---

## PL/pgSQL Components

### A. Stored Procedures (`procedures.sql`)

1. **`verify_production_log(log_id, authority_id, decision, remarks)`**
   - Updates `ProductionLog.verification_status`
   - Inserts into `PlantVerificationLog` (audit trail)
   - If `Verified`: calls `generate_carbon_credits()` (trigger also fires; duplicate handled gracefully)
   - Wrapped in `BEGIN ... COMMIT / ROLLBACK`

2. **`execute_credit_purchase(listing_id, buyer_id, quantity)`**
   - `SELECT ... FOR UPDATE` on `MarketListing` + `CreditWallet` (row-level locking)
   - Validates: Active listing, sufficient quantity, sufficient wallet, no self-purchase
   - `SAVEPOINT before_wallet_update` before wallet mutations
   - Atomically: inserts Transaction, deducts buyer, credits seller (−2% fee), updates listing
   - Full `COMMIT / ROLLBACK`

3. **`generate_compliance_report(company_id, authority_id)`**
   - Uses two explicit cursors to iterate CarbonCredit + Transaction records
   - Aggregates `total_credits_issued` and `total_credits_traded`
   - Inserts `ComplianceReport` with status = `Submitted`

4. **`approve_energy_plant(plant_id, authority_id, decision, remarks)`**
   - Updates `EnergyPlant.status`
   - Inserts audit record into `PlantVerificationLog`

### B. Functions (`functions.sql`)

| Function                                  | Returns   | Purpose                                       |
|-------------------------------------------|-----------|-----------------------------------------------|
| `calculate_carbon_credits(log_id)`        | NUMERIC   | `energy_kwh × 0.001` (1 MWh = 1 credit)      |
| `get_company_wallet_balance(company_id)`  | NUMERIC   | Returns `CreditWallet.balance`                |
| `calculate_marketplace_fee(total_amount)` | NUMERIC   | `total_amount × 0.02` (2% platform fee)       |
| `generate_carbon_credits(log_id)`         | VOID      | Core credit issuance logic (called by triggers too) |

### C. Triggers (`triggers.sql`)

| Trigger                            | Event                          | Action                                        |
|------------------------------------|--------------------------------|-----------------------------------------------|
| `trg_auto_create_wallet`           | AFTER INSERT ON Company        | Creates `CreditWallet` with balance = 0       |
| `trg_prevent_duplicate_credit`     | BEFORE INSERT ON CarbonCredit  | Raises `DUPLICATE_CREDIT_ISSUANCE` if exists  |
| `trg_auto_issue_credits`           | AFTER UPDATE ON ProductionLog  | Calls `generate_carbon_credits()` on Verified |
| `trg_prevent_negative_wallet`      | BEFORE UPDATE ON CreditWallet  | Raises error if `NEW.balance < 0`             |
| `trg_update_wallet_after_transaction` | AFTER INSERT ON Transaction | Validates non-negative wallet state (integrity check) |

### D. Cursors (`cursors.sql`)

1. **`generate_periodic_compliance_summary(authority_id)`** → `SETOF compliance_summary_record`
   - Cursor iterates over companies with reports under given authority
   - Returns: `(company_name, total_issued, total_traded, compliance_ratio)`

2. **`get_active_listings_cursor()`** → `SETOF active_listing_record`
   - Cursor iterates over all Active marketplace listings
   - Returns: `(listing_id, seller_name, credits_available, price_per_credit, total_value)`

### E. Exception Handling

| Custom Exception              | HTTP Status | When Raised                                    |
|-------------------------------|-------------|------------------------------------------------|
| `LOG_NOT_VERIFIED`            | 400         | Credits requested for unverified log           |
| `DUPLICATE_CREDIT_ISSUANCE`   | 409         | Credits already exist for this log             |
| `LISTING_NOT_ACTIVE`          | 400         | Buying from Sold/Cancelled listing             |
| `INSUFFICIENT_QUANTITY`       | 400         | Requesting more than listed                    |
| `INSUFFICIENT_WALLET_BALANCE` | 400         | Buyer cannot cover cost                        |
| `SELF_PURCHASE_NOT_ALLOWED`   | 400         | Buyer === Seller                               |
| `WALLET_NOT_FOUND`            | 404         | Company has no wallet                          |
| `LOG_NOT_FOUND`               | 404         | Production log does not exist                  |

---

## Setup Guide

**Prerequisites:** Docker + Docker Compose, Node.js 18+, npm 9+

---

### Step 1 — Start the Database (Docker)

`docker-compose.yml` runs PostgreSQL only. It auto-initialises the schema, all
PL/pgSQL objects, and seed data on the first start via `docker/init-db.sh`.

```bash
docker compose up -d
```

**Database URL:**
```
postgresql://postgres:postgres@localhost:5432/carbon_credits_db
```

**Useful DB commands:**

```bash
# Check DB is ready
docker compose ps

# Tail DB logs
docker compose logs -f db

# Open a psql shell
docker exec -it ccm_db psql -U postgres -d carbon_credits_db

# Full reset (wipes data volume — re-runs init on next up)
docker compose down -v
```

---

### Step 2 — Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` — the DB block is pre-filled to match the Docker container:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=carbon_credits_db
DB_USER=postgres
DB_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/carbon_credits_db
JWT_SECRET=change_this_to_any_long_random_string
```

```bash
npm run dev       # starts API on http://localhost:3001
```

> The database is already initialised by Docker — **do not** run `npm run db:setup`
> unless you need to re-run SQL files manually against a local Postgres instance.

---

### Step 3 — Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local
npm run dev       # starts UI on http://localhost:3000
```

---

### Step 4 — Access the Application

Open **http://localhost:3000** and log in with:

| Role                  | Username            | Password     |
|-----------------------|---------------------|--------------|
| Company Admin         | `company_admin`     | `password123` |
| Regulatory Authority  | `reg_authority`     | `password123` |
| Marketplace Admin     | `marketplace_admin` | `password123` |

---

## API Reference

| Method | Endpoint                             | Description                              | Role                  |
|--------|--------------------------------------|------------------------------------------|-----------------------|
| POST   | /api/auth/login                      | JWT login                                | Public                |
| POST   | /api/companies                       | Register company + admin user            | Public                |
| POST   | /api/plants                          | Register energy plant                    | Company Admin         |
| PUT    | /api/plants/:id/verify               | Approve/Reject plant → audit log         | Regulatory Authority  |
| POST   | /api/production-logs                 | Submit energy production log             | Company Admin         |
| PUT    | /api/production-logs/:id/verify      | Verify log → trigger credit issuance     | Regulatory Authority  |
| GET    | /api/credits                         | List all carbon credits                  | All                   |
| GET    | /api/credits/company/:id             | Company-specific credits                 | Company/Admin         |
| GET    | /api/wallet/:company_id              | Get wallet balance                       | Company Admin         |
| POST   | /api/listings                        | List credits for sale                    | Company Admin         |
| GET    | /api/listings                        | Active marketplace listings              | All                   |
| GET    | /api/listings/cursor                 | Active listings via DB cursor            | All                   |
| POST   | /api/transactions                    | Execute credit purchase (calls PROCEDURE)| Company Admin         |
| GET    | /api/transactions                    | All transactions                         | All                   |
| POST   | /api/compliance-reports              | Generate report (calls PROCEDURE)        | Company Admin         |
| PUT    | /api/compliance-reports/:id/audit    | Mark report as Audited                   | Regulatory Authority  |
| GET    | /api/analytics/reports               | Full analytics data                      | All Admins            |
| GET    | /api/analytics/top-buyers            | Top buyers subquery                      | Marketplace Admin     |

---

## Credit Lifecycle (System Workflow)

```
1. Company registers → wallet auto-created (trg_auto_create_wallet)
         ↓
2. Company registers EnergyPlant (status: Pending)
         ↓
3. Regulatory Authority approves plant → PlantVerificationLog entry
         ↓
4. Company submits ProductionLog (energy_kwh)
         ↓
5. Regulatory Authority calls verify_production_log()
         ↓ (stored procedure + trigger both fire)
6. trg_auto_issue_credits fires → generate_carbon_credits()
   - Inserts CarbonCredit record
   - Updates CreditWallet.balance += credits_issued
         ↓
7. Company creates MarketListing (quantity, price_per_credit)
         ↓
8. Buyer calls execute_credit_purchase() [stored procedure]
   - SELECT FOR UPDATE (row-level locking)
   - SAVEPOINT before_wallet_update
   - Deducts buyer wallet, credits seller (−2% fee)
   - Updates listing quantity/status
   - COMMIT
         ↓
9. Company calls generate_compliance_report()
   - Cursor iterates CarbonCredit and Transaction records
   - Inserts ComplianceReport (status: Submitted)
         ↓
10. Regulatory Authority marks report as Audited
```

---

## Security

- **SQL Injection Prevention**: All queries use parameterized `$1, $2, ...` placeholders — zero string concatenation
- **Concurrency Control**: `SELECT ... FOR UPDATE` in `execute_credit_purchase` prevents double-spending
- **SAVEPOINT**: Within `execute_credit_purchase` for partial-failure recovery
- **Password Security**: bcrypt with 12 salt rounds
- **JWT**: 8-hour expiry; `role`, `company_id`, `authority_id` embedded in payload
- **ACID Compliance**: All multi-table operations in explicit `BEGIN / COMMIT / ROLLBACK`
- **DB-Level Guards**: `balance >= 0` CHECK constraint + `trg_prevent_negative_wallet` BEFORE UPDATE trigger

---

## Environment Variables

### Backend (`.env`)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=carbon_credits_db
DB_USER=postgres
DB_PASSWORD=your_password
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/carbon_credits_db
JWT_SECRET=minimum_32_character_secret_key_here
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Seed Data Summary

| Entity               | Count | Notes                                      |
|----------------------|-------|--------------------------------------------|
| Companies            | 5     | Solar, Wind, Hydro, Biomass, Multi         |
| Regulatory Authorities | 2   | MNRE (National), CERC (National)           |
| Energy Plants        | 6     | Mix of Approved/Pending/Rejected           |
| Production Logs      | 8     | Mix of Verified/Pending/Rejected           |
| Carbon Credits       | 6     | Only for Verified logs                     |
| Credit Wallets       | 5     | One per company (realistic balances)       |
| Market Listings      | 6     | Mix of Active/Sold/Cancelled               |
| Transactions         | 8     | Cross-company trades                       |
| Compliance Reports   | 4     | Mix of Draft/Submitted/Audited             |
| Users                | 3     | One per role (password: `password123`)     |
| PlantVerificationLog | 13    | Full audit trail                           |
