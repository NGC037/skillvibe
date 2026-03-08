import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userSkills = await prisma.userSkill.findMany({
      where: { userId: session.user.id },
      include: { skill: true },
    });

    return NextResponse.json({
      success: true,
      userSkills,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { skillName, level } = body;

    if (!skillName || !level) {
      return NextResponse.json(
        { success: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });

    await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: session.user.id,
          skillId: skill.id,
        },
      },
      update: { level },
      create: {
        userId: session.user.id,
        skillId: skill.id,
        level,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADD SKILL ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}