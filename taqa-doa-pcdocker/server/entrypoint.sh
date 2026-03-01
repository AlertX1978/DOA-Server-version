#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
npx tsx scripts/migrate.ts

echo "[entrypoint] Starting development server..."
exec npm run dev
