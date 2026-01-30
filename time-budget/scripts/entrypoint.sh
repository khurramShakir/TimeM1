#!/bin/sh
set -e

echo "--- STARTUP DIAGNOSTICS ---"
echo "User: $(whoami)"
echo "Port: $PORT"
echo "Hostname: $HOSTNAME"
echo "-------------------------"

echo "Starting database migration (Incremental Sync)..."
# Run prisma db push to sync schema with Supabase incrementally.
# Note: --accept-data-loss is needed for precision changes (e.g., Decimal(65,30) -> Decimal(12,2))
prisma db push --skip-generate --accept-data-loss

echo "Starting server on port ${PORT:-3000}..."
# The Next.js standalone server listens on PORT or 3000
PORT=${PORT:-3000} exec node server.js
