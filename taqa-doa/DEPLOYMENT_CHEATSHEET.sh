#!/bin/bash
# Quick Reference: TAQA DOA Deployment Commands

# ============================================================================
# LOCAL DEVELOPMENT
# ============================================================================

# Start dev environment with hot-reload
docker compose up --pull always

# View logs
docker compose logs -f server
docker compose logs -f client
docker compose logs -f editor

# Stop all services
docker compose down

# Clean everything (including volumes)
docker compose down -v


# ============================================================================
# LOCAL STAGING (Production-like)
# ============================================================================

# Copy environment template
cp .env.example .env.staging

# Deploy all services
bash deploy-staging.sh up

# View logs
bash deploy-staging.sh logs server

# Tear down
bash deploy-staging.sh down


# ============================================================================
# AZURE CONTAINER APPS (Production)
# ============================================================================

# Login to Azure
az login

# Deploy server only
bash deploy.sh server

# Deploy client only
bash deploy.sh client

# Deploy both + run migrations
bash deploy.sh all

# Run migrations only (local machine to Azure DB)
bash deploy.sh migrate

# View recent deployments
az containerapp logs show --name doa-server --resource-group rg-doa-prod


# ============================================================================
# KUBERNETES (Helm)
# ============================================================================

# Install
helm install taqa-doa ./helm/taqa-doa \
  --namespace taqa-doa --create-namespace \
  --set postgres.password=$(openssl rand -base64 16)

# Upgrade with new image
helm upgrade taqa-doa ./helm/taqa-doa \
  --namespace taqa-doa \
  --set server.image.tag=abc1234

# View deployment status
kubectl get pods -n taqa-doa
kubectl logs -f deployment/doa-server -n taqa-doa

# Rollback
helm rollback taqa-doa -n taqa-doa

# Uninstall
helm uninstall taqa-doa -n taqa-doa


# ============================================================================
# CI/CD PIPELINE (GitHub Actions)
# ============================================================================

# View runs
gh run list --workflow deploy.yml

# View specific run
gh run view <run-id> --log

# View pull request checks
gh pr checks <pr-number>

# Manually trigger workflow
gh workflow run deploy.yml --ref main


# ============================================================================
# DEBUGGING
# ============================================================================

# Check which containers are running
docker ps

# Inspect container environment
docker inspect <container-id>

# Check resource usage
docker stats

# View network connections
docker network ls
docker network inspect doa-network

# Test database connection
docker compose exec db pg_isready -U doa_user -d taqa_doa

# Execute command in running container
docker compose exec server npm run migrate

# Build without pushing (test build)
docker build --target production -t doa-server:test ./server

# Build with buildx for multi-platform
docker buildx build --platform linux/amd64,linux/arm64 -t doa-server:test ./server
