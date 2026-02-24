-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "triggerOn" TEXT NOT NULL DEFAULT 'down';

-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "degradedThresholdMs" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "durationMs" INTEGER,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_serverId_startedAt_idx" ON "incidents"("serverId", "startedAt");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
