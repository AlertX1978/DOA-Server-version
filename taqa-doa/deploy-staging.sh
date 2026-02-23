#!/bin/bash
# ===========================================================================
# TAQA DOA — Local Staging Deployment Script
# ===========================================================================
# Usage:
#   bash deploy-staging.sh              # Deploy all services locally
#   bash deploy-staging.sh down         # Tear down all services
#   bash deploy-staging.sh logs         # View logs
# ===========================================================================
set -euo pipefail

# --- Configuration ---
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

# --- Colors ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[staging]${NC} $1"; }
warn() { echo -e "${YELLOW}[staging]${NC} $1"; }
err()  { echo -e "${RED}[staging]${NC} $1" >&2; }

# --- Pre-flight checks ---
preflight() {
  if [ ! -f "${ENV_FILE}" ]; then
    err "Missing ${ENV_FILE}. Create it from .env.example"
    exit 1
  fi

  if ! command -v docker &>/dev/null; then
    err "Docker not found. Install Docker Desktop."
    exit 1
  fi

  if ! command -v docker-compose &>/dev/null; then
    err "docker-compose not found. Install Docker Compose."
    exit 1
  fi

  log "Pre-flight checks passed."
}

# --- Load environment ---
load_env() {
  set -a
  source "${ENV_FILE}"
  set +a
  log "Environment loaded from ${ENV_FILE}"
}

# --- Deploy ---
deploy() {
  log "Deploying staging environment..."
  
  docker-compose \
    -f "${COMPOSE_FILE}" \
    --env-file "${ENV_FILE}" \
    up -d

  log "Waiting for services to be healthy..."
  sleep 5

  # Check service health
  if docker-compose -f "${COMPOSE_FILE}" ps | grep -q "unhealthy\|exited"; then
    warn "Some services are unhealthy. Run: docker-compose -f ${COMPOSE_FILE} logs"
    return 1
  fi

  log "Staging deployment complete!"
  show_info
}

# --- Tear down ---
teardown() {
  log "Tearing down staging environment..."
  docker-compose -f "${COMPOSE_FILE}" down -v
  log "Staging environment destroyed."
}

# --- Show info ---
show_info() {
  echo ""
  echo "============================================"
  echo "  Staging Environment"
  echo "============================================"
  echo "  Client:  http://localhost:5175"
  echo "  Editor:  http://localhost:5176"
  echo "  Server:  http://localhost:3001"
  echo "  DB:      localhost:5433"
  echo "============================================"
  echo ""
  echo "Useful commands:"
  echo "  docker-compose -f ${COMPOSE_FILE} logs -f"
  echo "  docker-compose -f ${COMPOSE_FILE} ps"
  echo "  docker-compose -f ${COMPOSE_FILE} down"
  echo ""
}

# --- View logs ---
view_logs() {
  docker-compose -f "${COMPOSE_FILE}" logs -f "$@"
}

# --- Main ---
cd "$(dirname "$0")"

COMMAND="${1:-up}"

preflight
load_env

case "${COMMAND}" in
  up)
    deploy
    ;;
  down)
    teardown
    ;;
  logs)
    view_logs "${2:-}"
    ;;
  *)
    echo "Usage: bash deploy-staging.sh [up|down|logs]"
    exit 1
    ;;
esac
