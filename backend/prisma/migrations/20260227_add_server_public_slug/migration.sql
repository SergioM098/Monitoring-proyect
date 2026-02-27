-- AlterTable
ALTER TABLE "servers" ADD COLUMN "publicSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "servers_publicSlug_key" ON "servers"("publicSlug");
