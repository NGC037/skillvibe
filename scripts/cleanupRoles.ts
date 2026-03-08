import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "MENTOR"],
      },
    },
  });

  for (const user of users) {
    await prisma.userSkill.deleteMany({
      where: { userId: user.id },
    });

    await prisma.participation.deleteMany({
      where: { userId: user.id },
    });
  }

  console.log("Old student data cleared for ADMIN and MENTOR users");

  await prisma.$disconnect();
}

cleanup().catch((e) => {
  console.error(e);
  process.exit(1);
});