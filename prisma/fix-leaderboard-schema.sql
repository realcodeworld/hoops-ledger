-- Run this if you see "column hideFromLeaderboard does not exist" or "table matches does not exist".
-- Uses the same DATABASE_URL as your app (from .env when you run: pnpm prisma db execute --file prisma/fix-leaderboard-schema.sql)

-- 1. Players: add leaderboard column
ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "hideFromLeaderboard" BOOLEAN NOT NULL DEFAULT false;

-- 2. Match tables (idempotent)
DO $$ BEGIN
  CREATE TYPE "MatchTeam" AS ENUM ('A', 'B');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "matches" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "winningTeam" "MatchTeam" NOT NULL,
    "teamATotalPoints" INTEGER NOT NULL,
    "teamBTotalPoints" INTEGER NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "match_players" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "team" "MatchTeam" NOT NULL,
    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "player_point_entries" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "player_point_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "matches_sessionId_idx" ON "matches"("sessionId");
CREATE INDEX IF NOT EXISTS "matches_orgId_idx" ON "matches"("orgId");
CREATE INDEX IF NOT EXISTS "match_players_matchId_idx" ON "match_players"("matchId");
CREATE INDEX IF NOT EXISTS "match_players_playerId_idx" ON "match_players"("playerId");
CREATE UNIQUE INDEX IF NOT EXISTS "match_players_matchId_playerId_key" ON "match_players"("matchId", "playerId");
CREATE INDEX IF NOT EXISTS "player_point_entries_playerId_idx" ON "player_point_entries"("playerId");
CREATE INDEX IF NOT EXISTS "player_point_entries_orgId_idx" ON "player_point_entries"("orgId");
CREATE INDEX IF NOT EXISTS "player_point_entries_matchId_idx" ON "player_point_entries"("matchId");

DO $$ BEGIN
  ALTER TABLE "matches" ADD CONSTRAINT "matches_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matches" ADD CONSTRAINT "matches_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "match_players" ADD CONSTRAINT "match_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "player_point_entries" ADD CONSTRAINT "player_point_entries_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "player_point_entries" ADD CONSTRAINT "player_point_entries_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "player_point_entries" ADD CONSTRAINT "player_point_entries_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
