#!/usr/bin/env bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  AlgoForge — Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Start Postgres — always wipe volume so credentials initialize fresh
echo ""
echo "[1/4] Starting PostgreSQL via Docker..."
docker compose down -v --remove-orphans 2>/dev/null || true
docker compose up -d postgres

# Wait for PG — test the ACTUAL algoforge user via psql, not pg_isready
# pg_isready passes even before custom users are created; psql SELECT 1 does not
echo "      Waiting for PostgreSQL to be ready..."
for i in {1..20}; do
  if docker exec algoforge-db psql -U algoforge -d algoforge -c "SELECT 1" -q 2>/dev/null | grep -q "1"; then
    echo "      PostgreSQL is ready ✅"
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "      ❌ PostgreSQL did not become ready in time."
    echo "      Check logs: docker compose logs postgres"
    exit 1
  fi
  echo "      Attempt $i/20 — waiting..."
  sleep 3
done

# 2. Install dependencies
echo ""
echo "[2/4] Installing dependencies..."
pnpm install

# 3. Generate Prisma client
echo ""
echo "[3/4] Generating Prisma client..."
pnpm db:generate

# 4. Run migrations
echo ""
echo "[4/4] Running database migrations..."
pnpm db:migrate

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete! ✅"
echo ""
echo "  Run the project:"
echo "    pnpm dev"
echo ""
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo "  Health:   http://localhost:4000/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"