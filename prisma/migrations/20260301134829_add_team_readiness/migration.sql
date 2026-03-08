-- AlterEnum
ALTER TYPE "ParticipationStatus" ADD VALUE 'PENDING';

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_eventId_fkey";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "isReady" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
