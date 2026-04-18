CREATE INDEX IF NOT EXISTS "matches_orgId_createdAt_idx"
ON "matches"("orgId", "createdAt");
