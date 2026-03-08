import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Ensure skills exist
  const requiredSkillNames = [
    "React",
    "Node",
    "UI/UX",
    "Python",
    "Machine Learning",
  ];

  for (const name of requiredSkillNames) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const hackathon = await prisma.event.findFirst({
    where: { title: "Hackathon 2026" },
  });

  const ai = await prisma.event.findFirst({
    where: { title: "AI Innovation Challenge" },
  });

  const skills = await prisma.skill.findMany();
  const skillMap = Object.fromEntries(
    skills.map((s) => [s.name, s.id])
  );

  if (hackathon) {
    const data = ["React", "Node", "UI/UX"]
      .map((name) => ({
        eventId: hackathon.id,
        skillId: skillMap[name],
      }))
      .filter((item) => item.skillId); // 🔥 prevents undefined

    await prisma.eventSkill.createMany({
      data,
      skipDuplicates: true,
    });
  }

  if (ai) {
    const data = ["Python", "Machine Learning"]
      .map((name) => ({
        eventId: ai.id,
        skillId: skillMap[name],
      }))
      .filter((item) => item.skillId);

    await prisma.eventSkill.createMany({
      data,
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true });
}
