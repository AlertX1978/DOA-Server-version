# ---------------------------------------------------------------------------
# Stage 1: Development (hot-reload with tsx)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS development

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# Stage 2: Build (compile TypeScript to JavaScript)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

RUN npm run build

# Compile migration runner separately (needed for production entrypoint)
RUN npx tsc scripts/migrate.ts --outDir dist-scripts --esModuleInterop --resolveJsonModule --module commonjs --target ES2022 --moduleResolution node --skipLibCheck

# ---------------------------------------------------------------------------
# Stage 3: Production (minimal image with compiled output)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-scripts ./dist-scripts
COPY migrations/ ./migrations/
COPY entrypoint.prod.sh ./
RUN chmod +x entrypoint.prod.sh

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3000

CMD ["sh", "entrypoint.prod.sh"]
