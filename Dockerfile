# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build backend ───────────────────────────────────────────────────
FROM node:20-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/ ./
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate \
    && npm run build \
    && cp src/generated/prisma/*.node dist/generated/prisma/ 2>/dev/null || true
# Prune dev deps for production
RUN npm prune --omit=dev

# ── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:20-alpine

# Nginx + Supervisor (Chromium no longer needed — Baileys uses WebSocket)
RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Backend
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/prisma ./backend/prisma

# Frontend: static files
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Config files
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 80

ENV NODE_ENV=production
ENV PORT=3001

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
