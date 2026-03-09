/*
  Warnings:

  - You are about to drop the column `creatorId` on the `SkillRequestPost` table. All the data in the column will be lost.
  - Added the required column `userId` to the `SkillRequestPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SkillRequestPost" DROP CONSTRAINT "SkillRequestPost_creatorId_fkey";

-- AlterTable
ALTER TABLE "SkillRequestPost" DROP COLUMN "creatorId",
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PostRequiredSkill" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "PostRequiredSkill_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SkillRequestPost" ADD CONSTRAINT "SkillRequestPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillRequestPost" ADD CONSTRAINT "SkillRequestPost_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostRequiredSkill" ADD CONSTRAINT "PostRequiredSkill_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SkillRequestPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostRequiredSkill" ADD CONSTRAINT "PostRequiredSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
