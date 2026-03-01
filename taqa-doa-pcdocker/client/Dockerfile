# ---------------------------------------------------------------------------
# Stage 1: Development (Vite dev server with hot-reload)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS development

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# Stage 2: Build (compile TypeScript + bundle with Vite)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production (nginx serving static files)
# ---------------------------------------------------------------------------
FROM nginx:alpine AS production

# Use nginx templates — envsubst replaces ${API_BACKEND_URL} at startup.
# Only substitute API_BACKEND_URL (preserve other nginx $ variables).
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d
ENV API_BACKEND_URL=http://doa-server

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
