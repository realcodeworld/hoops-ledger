-- CreateEnum
CREATE TYPE "MatchTeam" AS ENUM ('A', 'B');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "hideFromLeaderboard" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "matches" (
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

-- CreateTable
CREATE TABLE "match_players" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "team" "MatchTeam" NOT NULL,

    CONSTRAINT "match_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_point_entries" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "matchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_point_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_sessionId_idx" ON "matches"("sessionId");

-- CreateIndex
CREATE INDEX "matches_orgId_idx" ON "matches"("orgId");

-- CreateIndex
CREATE INDEX "match_players_matchId_idx" ON "match_players"("matchId");

-- CreateIndex
CREATE INDEX "match_players_playerId_idx" ON "match_players"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "match_players_matchId_playerId_key" ON "match_players"("matchId", "playerId");

-- CreateIndex
CREATE INDEX "player_point_entries_playerId_idx" ON "player_point_entries"("playerId");

-- CreateIndex
CREATE INDEX "player_point_entries_orgId_idx" ON "player_point_entries"("orgId");

-- CreateIndex
CREATE INDEX "player_point_entries_matchId_idx" ON "player_point_entries"("matchId");

-- CreateIndex
CREATE INDEX "attendance_playerId_idx" ON "attendance"("playerId");

-- CreateIndex
CREATE INDEX "attendance_playerId_status_idx" ON "attendance"("playerId", "status");

-- CreateIndex
CREATE INDEX "attendance_sessionId_idx" ON "attendance"("sessionId");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX "attendance_paymentId_idx" ON "attendance"("paymentId");

-- CreateIndex
CREATE INDEX "attendance_checkedInAt_idx" ON "attendance"("checkedInAt");

-- CreateIndex
CREATE INDEX "audit_logs_orgId_idx" ON "audit_logs"("orgId");

-- CreateIndex
CREATE INDEX "audit_logs_orgId_createdAt_idx" ON "audit_logs"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "magic_links_token_idx" ON "magic_links"("token");

-- CreateIndex
CREATE INDEX "magic_links_playerId_idx" ON "magic_links"("playerId");

-- CreateIndex
CREATE INDEX "magic_links_orgId_idx" ON "magic_links"("orgId");

-- CreateIndex
CREATE INDEX "payments_orgId_idx" ON "payments"("orgId");

-- CreateIndex
CREATE INDEX "payments_orgId_occurredOn_idx" ON "payments"("orgId", "occurredOn");

-- CreateIndex
CREATE INDEX "payments_playerId_idx" ON "payments"("playerId");

-- CreateIndex
CREATE INDEX "payments_sessionId_idx" ON "payments"("sessionId");

-- CreateIndex
CREATE INDEX "payments_occurredOn_idx" ON "payments"("occurredOn");

-- CreateIndex
CREATE INDEX "players_orgId_idx" ON "players"("orgId");

-- CreateIndex
CREATE INDEX "players_orgId_isActive_idx" ON "players"("orgId", "isActive");

-- CreateIndex
CREATE INDEX "players_pricingRuleId_idx" ON "players"("pricingRuleId");

-- CreateIndex
CREATE INDEX "pricing_rules_orgId_idx" ON "pricing_rules"("orgId");

-- CreateIndex
CREATE INDEX "sessions_orgId_idx" ON "sessions"("orgId");

-- CreateIndex
CREATE INDEX "sessions_orgId_startsAt_idx" ON "sessions"("orgId", "startsAt");

-- CreateIndex
CREATE INDEX "sessions_startsAt_idx" ON "sessions"("startsAt");

-- CreateIndex
CREATE INDEX "users_orgId_idx" ON "users"("orgId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_players" ADD CONSTRAINT "match_players_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_point_entries" ADD CONSTRAINT "player_point_entries_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_point_entries" ADD CONSTRAINT "player_point_entries_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_point_entries" ADD CONSTRAINT "player_point_entries_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
