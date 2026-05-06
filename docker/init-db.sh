#!/bin/bash
# Runs all SQL files in the correct dependency order on first DB container start.
# Postgres executes every *.sh file in /docker-entrypoint-initdb.d/ automatically.
set -e

echo "==> Running Carbon Credit Marketplace DB initialisation..."

psql -v ON_ERROR_STOP=1 \
     --username "$POSTGRES_USER" \
     --dbname   "$POSTGRES_DB"   \
     <<-EOSQL

-- 1. Schema (DDL)
\i /docker-entrypoint-initdb.d/db/migrations/001_create_tables.sql

-- 2. Indexes
\i /docker-entrypoint-initdb.d/db/migrations/002_create_indexes.sql

-- 3. Views
\i /docker-entrypoint-initdb.d/db/migrations/003_create_views.sql

-- 4. PL/pgSQL Functions
\i /docker-entrypoint-initdb.d/db/procedures/functions.sql

-- 5. Stored Procedures (COMMIT/ROLLBACK)
\i /docker-entrypoint-initdb.d/db/procedures/procedures.sql

-- 6. Triggers
\i /docker-entrypoint-initdb.d/db/procedures/triggers.sql

-- 7. Cursor-based Functions
\i /docker-entrypoint-initdb.d/db/procedures/cursors.sql

-- 8. Seed Data
\i /docker-entrypoint-initdb.d/db/seeds/seed.sql

EOSQL

echo "==> Database initialisation complete."
