-- AlterTable: Add new columns to MonthlyMission (safe with IF NOT EXISTS via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='MonthlyMission' AND column_name='rules') THEN
    ALTER TABLE "MonthlyMission" ADD COLUMN "rules" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='MonthlyMission' AND column_name='prizes') THEN
    ALTER TABLE "MonthlyMission" ADD COLUMN "prizes" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='MonthlyMission' AND column_name='winnerId') THEN
    ALTER TABLE "MonthlyMission" ADD COLUMN "winnerId" TEXT;
  END IF;
END $$;

-- AlterTable: Add new columns to MissionSubmission
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='MissionSubmission' AND column_name='videoUrl') THEN
    ALTER TABLE "MissionSubmission" ADD COLUMN "videoUrl" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='MissionSubmission' AND column_name='updatedAt') THEN
    ALTER TABLE "MissionSubmission" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Deduplicate: Keep only the latest submission per (missionId, userId)
DELETE FROM "MissionSubmission" a
USING "MissionSubmission" b
WHERE a."missionId" = b."missionId"
  AND a."userId" = b."userId"
  AND a."createdAt" < b."createdAt";

-- CreateIndex: Unique constraint for one submission per user per mission
CREATE UNIQUE INDEX IF NOT EXISTS "MissionSubmission_missionId_userId_key" ON "MissionSubmission"("missionId", "userId");

-- CreateIndex: Unique on winnerId for one-to-one relation
CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyMission_winnerId_key" ON "MonthlyMission"("winnerId");

-- AddForeignKey: winnerId -> MissionSubmission
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MonthlyMission_winnerId_fkey') THEN
    ALTER TABLE "MonthlyMission" ADD CONSTRAINT "MonthlyMission_winnerId_fkey"
      FOREIGN KEY ("winnerId") REFERENCES "MissionSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Seed: Update existing Weathering Challenge with rules and prizes
UPDATE "MonthlyMission"
SET "rules" = 'Show us your best weathering techniques on any Gundam kit — washes, chipping, rust effects, oil stains, battle damage, or environmental wear. All scales and grades welcome.

RULES:
• Submit at least 1 photo of your weathered build (up to 20 images)
• Video walkthroughs are welcome (optional, 1 video max)
• Work must be your own — no AI-generated images
• Both new builds and weathering applied to existing builds are accepted
• Submissions can be edited until the deadline
• One entry per pilot',
    "prizes" = 'GRAND PRIZE: Featured Builder spotlight on the homepage for the entire next month, exclusive "Weathering Master" badge on your profile, and your build permanently pinned in the Weathering workshop.

RUNNER-UP: "Storm Bringer" profile badge and featured in the Monthly Mission hall of fame.'
WHERE "isActive" = true AND "rules" IS NULL;
