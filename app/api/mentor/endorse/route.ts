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
    const { studentId, skillIds } = body;

    if (
      !studentId ||
      !skillIds ||
      !Array.isArray(skillIds) ||
      skillIds.length === 0
    ) {
      return NextResponse.json(
        { error: "studentId and skillIds array required" },
        { status: 400 },
      );
    }

    // ✅ Verify mentor-mentee relationship
    const mentorMentee = await prisma.mentorMentee.findFirst({
      where: {
        mentorId: session.user.id,
        studentId: studentId,
      },
    });

    if (!mentorMentee) {
      return NextResponse.json(
        { error: "Not authorized to endorse this student's skills" },
        { status: 403 },
      );
    }

    // ✅ Verify all skills belong to the student
    const userSkills = await prisma.userSkill.findMany({
      where: {
        userId: studentId,
        skillId: { in: skillIds },
      },
    });

    if (userSkills.length !== skillIds.length) {
      return NextResponse.json(
        { error: "Some skills do not belong to this student" },
        { status: 400 },
      );
    }

    // ✅ Update endorsements (skip already endorsed)
    const updateResults = await Promise.all(
      skillIds.map((skillId) =>
        prisma.userSkill.update({
          where: {
            userId_skillId: {
              userId: studentId,
              skillId: skillId,
            },
          },
          data: {
            endorsed: true,
          },
        }),
      ),
    );

    return NextResponse.json({
      message: "Skills endorsed successfully",
      endorsedCount: updateResults.length,
    });
  } catch (error) {
    console.error("MENTOR ENDORSE ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
