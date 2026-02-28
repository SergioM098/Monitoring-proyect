-- =============================================
-- Server Monitor - PostgreSQL Schema
-- =============================================

-- Tabla de usuarios
CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Tabla de servidores
CREATE TABLE "servers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "checkType" TEXT NOT NULL DEFAULT 'http',
    "intervalSec" INTEGER NOT NULL DEFAULT 60,
    "degradedThresholdMs" INTEGER NOT NULL DEFAULT 5000,
    "status" TEXT NOT NULL DEFAULT 'unknown',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "servers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "servers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Tabla de checks
CREATE TABLE "checks" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "serverId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseTimeMs" INTEGER,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "checks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checks_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE
);
CREATE INDEX "checks_serverId_checkedAt_idx" ON "checks"("serverId", "checkedAt");

-- Tabla de notificaciones
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "serverId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email',
    "destination" TEXT NOT NULL,
    "triggerOn" TEXT NOT NULL DEFAULT 'down',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE
);

-- Tabla de incidentes
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "serverId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "incidents_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE
);
CREATE INDEX "incidents_serverId_startedAt_idx" ON "incidents"("serverId", "startedAt");

-- Tabla de logs de notificaciones
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "serverId" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notification_logs_serverId_sentAt_idx" ON "notification_logs"("serverId", "sentAt");

-- Tabla de configuracion
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);
