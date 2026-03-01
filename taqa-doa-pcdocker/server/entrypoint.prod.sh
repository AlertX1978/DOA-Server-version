#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node dist-scripts/migrate.js

echo "[entrypoint] Starting production server..."
exec node dist/index.js
