#!/bin/sh
set -e

echo "--- STARTUP DIAGNOSTICS ---"
echo "User: $(whoami)"
echo "Port: $PORT"
echo "Hostname: $HOSTNAME"
echo "-------------------------"

echo "Starting database migration..."
# Run prisma db push to sync schema with Supabase.
# --skip-generate is CRITICAL because the client is already built and we don't have write access to global node_modules.
prisma db push --accept-data-loss --skip-generate

echo "Starting server..."
# The Next.js standalone server listens on PORT or 3000
exec node server.js
