-- CreateTable
CREATE TABLE "pricing_rule_versions" (
    "id" TEXT NOT NULL,
    "pricingRuleId" TEXT NOT NULL,
    "feePence" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_rule_versions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN "pricingRuleId" TEXT;

-- CreateIndex
CREATE INDEX "pricing_rule_versions_pricingRuleId_effectiveFrom_idx" ON "pricing_rule_versions"("pricingRuleId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "attendance_pricingRuleId_idx" ON "attendance"("pricingRuleId");

-- AddForeignKey
ALTER TABLE "pricing_rule_versions" ADD CONSTRAINT "pricing_rule_versions_pricingRuleId_fkey" FOREIGN KEY ("pricingRuleId") REFERENCES "pricing_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_pricingRuleId_fkey" FOREIGN KEY ("pricingRuleId") REFERENCES "pricing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Baseline: one version per existing rule (fee at rule creation)
INSERT INTO "pricing_rule_versions" ("id", "pricingRuleId", "feePence", "effectiveFrom", "createdAt")
SELECT
  'baseline-' || pr.id,
  pr.id,
  pr."feePence",
  pr."createdAt",
  CURRENT_TIMESTAMP
FROM "pricing_rules" pr;

-- Backfill attendance category snapshot from player's current category
UPDATE "attendance" a
SET "pricingRuleId" = p."pricingRuleId"
FROM "players" p
WHERE a."playerId" = p.id AND a."pricingRuleId" IS NULL;
