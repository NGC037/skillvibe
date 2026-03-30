import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // ✅ Auth check
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Role check (MENTOR ONLY)
    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can endorse skills" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { userSkillId } = body;

    if (!userSkillId) {
      return NextResponse.json(
        { error: "userSkillId required" },
        { status: 400 },
      );
    }

    // ✅ Check if skill exists
    const userSkill = await prisma.userSkill.findUnique({
      where: { id: userSkillId },
    });

    if (!userSkill) {
      return NextResponse.json(
        { error: "UserSkill not found" },
        { status: 404 },
      );
    }

    // ✅ Update endorsement
    await prisma.userSkill.update({
      where: { id: userSkillId },
      data: {
        endorsed: true,
      },
    });

    return NextResponse.json({
      message: "Skill endorsed successfully",
    });
  } catch (error) {
    console.error("ENDORSE ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
