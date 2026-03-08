-- DropForeignKey
ALTER TABLE "Participation" DROP CONSTRAINT "Participation_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Participation" DROP CONSTRAINT "Participation_userId_fkey";

-- AlterTable
ALTER TABLE "Participation" ALTER COLUMN "status" SET DEFAULT 'INTERESTED';

-- CreateTable
CREATE TABLE "EventSkill" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "EventSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventSkill_eventId_skillId_key" ON "EventSkill"("eventId", "skillId");

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSkill" ADD CONSTRAINT "EventSkill_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSkill" ADD CONSTRAINT "EventSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
