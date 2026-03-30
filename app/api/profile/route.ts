import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await req.json();
    const { bio, skills, projects, userId: requestedUserId } = body;

    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      // ✅ Update bio
      if (bio !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { bio },
        });
      }

      // ✅ Replace skills
      if (skills) {
        // delete old
        await tx.userSkill.deleteMany({
          where: { userId },
        });
        // update
        await tx.user.update({
          where: { id: userId },
          data: { bio },
        });

        // create new
        for (const s of skills) {
          await tx.userSkill.create({
            data: {
              userId,
              skillId: s.skillId,
              level: s.level, // must match enum
            },
          });
        }
      }

      // ✅ Replace projects
      if (projects) {
        // delete old
        await tx.project.deleteMany({
          where: { ownerId: userId },
        });

        // create new
        for (const p of projects) {
          await tx.project.create({
            data: {
              title: p.title,
              shortDescription: p.shortDescription,
              fullDescription: p.fullDescription,
              architecture: p.architecture,
              totalPhases: p.totalPhases || 1,
              currentPhase: 1,
              ownerId: userId,
            },
          });
        }
      }
    });

    return NextResponse.json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
