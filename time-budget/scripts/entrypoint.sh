#!/bin/sh
set -e

echo "--- STARTUP DIAGNOSTICS ---"
echo "User: $(whoami)"
echo "Port: $PORT"
echo "Hostname: $HOSTNAME"
echo "-------------------------"

echo "Starting database migration (Incremental Sync)..."
# Run prisma db push to sync schema with Supabase incrementally.
# We remove --accept-data-loss to ensure data safety.
prisma db push --skip-generate

echo "Starting server..."
# The Next.js standalone server listens on PORT or 3000
exec node server.js
