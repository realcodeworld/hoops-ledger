-- AlterTable
ALTER TABLE "players" ADD COLUMN "paymentRef" TEXT;

-- Backfill: use existing id as stable unique reference for current rows
UPDATE "players" SET "paymentRef" = "id";

ALTER TABLE "players" ALTER COLUMN "paymentRef" SET NOT NULL;

CREATE UNIQUE INDEX "players_paymentRef_key" ON "players"("paymentRef");
