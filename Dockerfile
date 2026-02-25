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
RUN npx prisma generate && npm run build

# ── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache nginx supervisor

WORKDIR /app

# Backend: production deps
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci --omit=dev

# Backend: compiled JS
COPY --from=backend-build /app/backend/dist ./backend/dist
# Backend: prisma schema (for migrate deploy)
COPY --from=backend-build /app/backend/prisma ./backend/prisma
# Backend: prisma engine binaries
COPY --from=backend-build /app/backend/src/generated ./backend/dist/generated

# Frontend: static files
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Config files
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 80

ENV NODE_ENV=production
ENV PORT=3001

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
