# TAQA DOA Deployment Pipeline

This document describes the complete deployment pipeline for the TAQA DOA application.

## Architecture Overview

The TAQA DOA application consists of:
- **Server**: Node.js API backend (TypeScript)
- **Client**: Vue/Vite frontend
- **Editor**: Vue/Vite editor application
- **Database**: PostgreSQL 16

## Deployment Options

### 1. Local Development
Use the default `docker-compose.yml` for hot-reload development.

```bash
docker compose up --pull always
```

### 2. Local Staging
Simulate production locally with `docker-compose.staging.yml`.

```bash
# Create .env.staging from .env.example
cp .env.example .env.staging
# Edit .env.staging with staging values

# Deploy
bash deploy-staging.sh up

# View logs
bash deploy-staging.sh logs server

# Tear down
bash deploy-staging.sh down
```

### 3. Azure Container Apps (Current)
Uses the `deploy.sh` script to build and push to Azure Container Registry (ACR).

```bash
# Deploy all services
bash deploy.sh all

# Deploy specific service
bash deploy.sh server
bash deploy.sh client

# Run migrations
bash deploy.sh migrate
```

### 4. Kubernetes (Helm)
Use the Helm chart for multi-node Kubernetes clusters.

```bash
# Add Helm repository
helm repo add taqa-doa ./helm

# Install
helm install taqa-doa taqa-doa/taqa-doa \
  --namespace taqa-doa \
  --create-namespace \
  -f values-prod.yaml \
  --set postgres.password=$(openssl rand -base64 16)

# Upgrade
helm upgrade taqa-doa taqa-doa/taqa-doa \
  --namespace taqa-doa \
  -f values-prod.yaml

# Uninstall
helm uninstall taqa-doa --namespace taqa-doa
```

## CI/CD Pipeline (GitHub Actions)

### Workflow: `.github/workflows/deploy.yml`

**Trigger Events:**
- Push to `main` → Production deployment
- Push to `develop` → Staging deployment
- Pull requests → Build, test, security scan (no deployment)

**Pipeline Stages:**

1. **Build** (parallel for all 3 services)
   - Logs into ACR
   - Builds multi-stage Docker images
   - Pushes to registry with tags:
     - `latest` (always)
     - `<short-sha>` (commit hash)
     - `production` or `staging` (branch-based)
   - Caches layers via GitHub Actions cache

2. **Test**
   - Starts PostgreSQL service
   - Runs npm test for server, client, and editor
   - Uses service containers for DB

3. **Security Scan**
   - Runs Trivy vulnerability scanner on built images
   - Uploads SARIF results to GitHub Security tab
   - Fails if critical/high severity vulnerabilities found

4. **Deploy Staging** (if develop branch)
   - Requires `staging` environment approval (optional)
   - Logs into Azure
   - Runs `deploy.sh` against staging resource group
   - Includes automatic migrations

5. **Deploy Production** (if main branch)
   - Requires `production` environment approval (recommended)
   - Logs into Azure
   - Runs `deploy.sh` against production resource group
   - Includes automatic migrations
   - Posts success comment on PR/issue

## Required GitHub Secrets

```
ACR_REGISTRY          = acrdoaprod.azurecr.io
ACR_USERNAME          = <service-principal-username>
ACR_PASSWORD          = <service-principal-password>
AZURE_CREDENTIALS     = <service-principal-json>
STAGING_RESOURCE_GROUP = rg-doa-staging
PRODUCTION_RESOURCE_GROUP = rg-doa-prod
```

## Required Environment Variables

### Development (.env)
```
AZURE_TENANT_ID=<your-tenant>
AZURE_CLIENT_ID=<your-client>
AZURE_CLIENT_SECRET=<your-secret>
VITE_AZURE_CLIENT_ID=<your-spa-client>
VITE_AZURE_TENANT_ID=<your-tenant>
```

### Staging (.env.staging)
```
ACR_REGISTRY=acrdoaprod.azurecr.io
AZURE_TENANT_ID=<staging-tenant>
AZURE_CLIENT_ID=<staging-client>
AZURE_CLIENT_SECRET=<staging-secret>
PG_USER=doa_staging_user
PG_PASSWORD=<strong-password>
CORS_ORIGIN=http://localhost:5175
API_BACKEND_URL=http://localhost:3001/api/v1
```

### Production (.env.production)
```
ACR_REGISTRY=acrdoaprod.azurecr.io
AZURE_TENANT_ID=<prod-tenant>
AZURE_CLIENT_ID=<prod-client>
AZURE_CLIENT_SECRET=<prod-secret>
PG_USER=doa_admin
PG_PASSWORD=<very-strong-password>
CORS_ORIGIN=https://doa.example.com
API_BACKEND_URL=https://api.doa.example.com/api/v1
```

## Deployment Workflow

### Typical Release Flow

1. **Feature Development** → Push to feature branch
   - GitHub Actions runs build + test + security scan
   - No deployment

2. **Integration Testing** → Create PR to `develop`
   - Runs build, test, security scan
   - On merge to `develop`: auto-deploys to staging
   - Team tests on staging

3. **Production Release** → Create PR to `main`
   - Runs build, test, security scan
   - On merge to `main`: auto-deploys to production
   - Requires approval in GitHub environments

### Manual Deployments

To manually deploy a specific version:

```bash
# Push a tag
git tag v1.2.3 main
git push origin v1.2.3

# Or manually trigger GitHub Actions from the UI
# Go to Actions → Deploy → "Run workflow" → select branch/tag
```

## Monitoring & Rollback

### View Deployment Status

**GitHub Actions:**
```bash
gh run list --workflow deploy.yml
gh run view <run-id> --log
```

**Azure:**
```bash
az containerapp logs show \
  --name doa-server \
  --resource-group rg-doa-prod
```

**Docker Compose (local):**
```bash
docker compose logs -f [service]
```

### Rollback

**Azure Container Apps:**
```bash
# Revert to previous image tag
az containerapp update \
  --resource-group rg-doa-prod \
  --name doa-server \
  --image acrdoaprod.azurecr.io/doa-server:previous-tag
```

**Kubernetes (Helm):**
```bash
# Rollback to previous release
helm rollback taqa-doa -n taqa-doa

# List release history
helm history taqa-doa -n taqa-doa
```

## Health Checks & Auto-recovery

### Configured Health Checks

**Server:** `GET /health` (3s timeout, 10s interval, 3 failures to fail)
**Client:** `GET /` (5s timeout, 10s interval, 3 failures to fail)
**Database:** PostgreSQL health check via `pg_isready`

### Auto-recovery Policies

- Docker Compose: `restart: always`
- Kubernetes: `imagePullPolicy: Always`, liveness/readiness probes
- Azure Container Apps: Built-in auto-restart on failure

## Security Best Practices

1. **Image Security**
   - Trivy scanning in CI/CD
   - Non-root user (UID 1001) in all containers
   - Multi-stage builds reduce image size
   - Alpine base images minimize attack surface

2. **Secrets Management**
   - Use GitHub Actions environment secrets
   - Use Azure Key Vault for production
   - Use Kubernetes Secrets for K8s deployments
   - Rotate credentials regularly

3. **Network Security**
   - HTTPS/TLS via nginx (client/editor)
   - Private databases (not exposed to internet)
   - Firewalls restrict access

4. **Access Control**
   - Service principals with minimal scopes
   - Environment approval gates in GitHub
   - RBAC in Kubernetes

## Troubleshooting

### Build Failures
- Check Docker daemon: `docker ps`
- Check ACR login: `az acr login --name acrdoaprod`
- Check disk space: `docker system df`
- Retry with clean cache: `docker system prune -a`

### Deployment Failures
- Check logs: `docker compose logs service-name`
- Verify environment variables: `docker inspect container-name`
- Check networking: `docker network inspect doa-network`
- Verify port availability: `netstat -an | grep 3001`

### Database Connection Issues
- Verify DATABASE_URL format
- Check pg_isready: `docker compose exec db pg_isready -U doa_user`
- Check firewall rules (Azure)
- Verify credentials in secrets

### Performance Issues
- Check resource limits: `docker stats`
- Monitor database queries: `docker compose exec db psql -U doa_user -d taqa_doa`
- Review application logs for errors
- Use `docker compose top` to see process info

## Next Steps

1. **Set up GitHub secrets** for CI/CD
2. **Create Azure resources** (ACR, Container Apps, PostgreSQL)
3. **Test local staging** deployment
4. **Enable branch protection** rules on `main` and `develop`
5. **Configure monitoring** (Application Insights, log aggregation)
6. **Set up alerting** for deployment failures
7. **Document runbooks** for on-call team
