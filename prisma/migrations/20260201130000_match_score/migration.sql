-- AlterTable: Add optional match score (teamAScore, teamBScore) for display
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "teamAScore" INTEGER;
ALTER TABLE "matches" ADD COLUMN IF NOT EXISTS "teamBScore" INTEGER;
