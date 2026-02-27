-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('scheduled', 'completed', 'cancelled');

-- AlterTable
ALTER TABLE "sessions"
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'scheduled',
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledReason" TEXT;

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

