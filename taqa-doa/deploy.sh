#!/bin/bash
# ===========================================================================
# TAQA DOA — Azure Container Apps Deployment Script
# ===========================================================================
# Usage:
#   bash deploy.sh              # Deploy both server and client
#   bash deploy.sh server       # Deploy server only
#   bash deploy.sh client       # Deploy client only
#   bash deploy.sh migrate      # Run migrations only (from local machine)
# ===========================================================================
set -euo pipefail

# --- Configuration ---
RESOURCE_GROUP="rg-doa-prod"
ACR_NAME="acrdoaprod"
ACR_SERVER="${ACR_NAME}.azurecr.io"
SERVER_APP="doa-server"
CLIENT_APP="doa-client"
PG_SERVER="pg-doa-prod"
PG_DB="taqa_doa"
PG_USER="doa_admin"

# Image tag: use git short hash if available, otherwise timestamp
if git rev-parse --short HEAD >/dev/null 2>&1; then
  TAG=$(git rev-parse --short HEAD)
else
  TAG=$(date +%Y%m%d-%H%M%S)
fi

SERVER_IMAGE="${ACR_SERVER}/${SERVER_APP}:${TAG}"
CLIENT_IMAGE="${ACR_SERVER}/${CLIENT_APP}:${TAG}"

# --- Colors ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
err()  { echo -e "${RED}[deploy]${NC} $1" >&2; }

# --- Pre-flight checks ---
preflight() {
  log "Running pre-flight checks..."

  if ! command -v az &>/dev/null; then
    err "Azure CLI not found. Install from https://aka.ms/installazurecli"
    exit 1
  fi

  if ! az account show &>/dev/null; then
    warn "Not logged in to Azure. Running 'az login'..."
    az login
  fi

  log "Subscription: $(az account show --query name -o tsv)"
}

# --- Login to ACR ---
acr_login() {
  log "Logging in to Azure Container Registry..."
  az acr login --name "${ACR_NAME}"
}

# --- Build and push server ---
deploy_server() {
  log "Building server image: ${SERVER_IMAGE}"
  docker build \
    --target production \
    -t "${SERVER_IMAGE}" \
    -f server/Dockerfile \
    ./server

  log "Pushing server image..."
  docker push "${SERVER_IMAGE}"

  log "Updating doa-server container app..."
  az containerapp update \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${SERVER_APP}" \
    --image "${SERVER_IMAGE}"

  log "Server deployed: ${SERVER_IMAGE}"
}

# --- Build and push client ---
deploy_client() {
  log "Building client image: ${CLIENT_IMAGE}"
  docker build \
    --target production \
    -t "${CLIENT_IMAGE}" \
    -f client/Dockerfile \
    ./client

  log "Pushing client image..."
  docker push "${CLIENT_IMAGE}"

  log "Updating doa-client container app..."
  az containerapp update \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${CLIENT_APP}" \
    --image "${CLIENT_IMAGE}"

  log "Client deployed: ${CLIENT_IMAGE}"
}

# --- Run migrations from local machine ---
run_migrations() {
  log "Running migrations against Azure PostgreSQL..."

  PG_FQDN=$(az postgres flexible-server show \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${PG_SERVER}" \
    --query fullyQualifiedDomainName -o tsv)

  # Add local IP to firewall
  MY_IP=$(curl -s https://api.ipify.org)
  log "Adding firewall rule for ${MY_IP}..."
  az postgres flexible-server firewall-rule create \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${PG_SERVER}" \
    --rule-name "Deploy-${TAG}" \
    --start-ip-address "${MY_IP}" \
    --end-ip-address "${MY_IP}" 2>/dev/null || true

  # Prompt for password
  read -sp "PostgreSQL password for ${PG_USER}: " PG_PASS
  echo ""

  DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@${PG_FQDN}:5432/${PG_DB}?sslmode=require"

  cd server
  DATABASE_URL="${DATABASE_URL}" node ./node_modules/tsx/dist/cli.mjs scripts/migrate.ts
  cd ..

  log "Migrations complete."
}

# --- Show deployment info ---
show_info() {
  CLIENT_FQDN=$(az containerapp show \
    --resource-group "${RESOURCE_GROUP}" \
    --name "${CLIENT_APP}" \
    --query "properties.configuration.ingress.fqdn" -o tsv 2>/dev/null)

  echo ""
  echo "============================================"
  echo "  Deployment Complete"
  echo "============================================"
  echo "  App URL:  https://${CLIENT_FQDN}"
  echo "  Tag:      ${TAG}"
  echo "============================================"
  echo ""
}

# --- Main ---
cd "$(dirname "$0")"

COMMAND="${1:-all}"

preflight

case "${COMMAND}" in
  server)
    acr_login
    deploy_server
    show_info
    ;;
  client)
    acr_login
    deploy_client
    show_info
    ;;
  migrate)
    run_migrations
    ;;
  all)
    acr_login
    deploy_server
    deploy_client
    show_info
    ;;
  *)
    echo "Usage: bash deploy.sh [server|client|migrate|all]"
    exit 1
    ;;
esac
