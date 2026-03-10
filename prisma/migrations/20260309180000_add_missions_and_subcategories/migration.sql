-- CreateTable
CREATE TABLE "MonthlyMission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionSubmission" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionSubmission_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add parentId to ForumCategory
ALTER TABLE "ForumCategory" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "MissionSubmission_missionId_idx" ON "MissionSubmission"("missionId");

-- CreateIndex
CREATE INDEX "MissionSubmission_userId_idx" ON "MissionSubmission"("userId");

-- CreateIndex
CREATE INDEX "ForumCategory_parentId_idx" ON "ForumCategory"("parentId");

-- AddForeignKey
ALTER TABLE "ForumCategory" ADD CONSTRAINT "ForumCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSubmission" ADD CONSTRAINT "MissionSubmission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "MonthlyMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSubmission" ADD CONSTRAINT "MissionSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
