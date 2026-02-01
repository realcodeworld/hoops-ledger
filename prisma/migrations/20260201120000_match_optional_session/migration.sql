-- AlterTable: Make Match.sessionId optional so matches can exist outside of sessions
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_sessionId_fkey";
ALTER TABLE "matches" ALTER COLUMN "sessionId" DROP NOT NULL;
ALTER TABLE "matches" ADD CONSTRAINT "matches_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
