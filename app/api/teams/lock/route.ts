import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
const teamId = formData.get("teamId") as string;;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        event: {
          include: {
            eventSkills: {
              include: { skill: true },
            },
          },
        },
        members: {
          include: {
            user: {
              include: {
                skills: {
                  include: { skill: true },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Only leader can lock
    if (team.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team leader can lock this team." },
        { status: 403 }
      );
    }

    if (team.members.length < team.event.minTeamSize) {
      return NextResponse.json(
        { error: "Team must meet the minimum team size before locking." },
        { status: 400 },
      );
    }

    if (team.members.length > team.event.maxTeamSize) {
      return NextResponse.json(
        { error: "Team exceeds the maximum team size." },
        { status: 400 },
      );
    }

    const confirmedCount = await prisma.participation.count({
      where: {
        eventId: team.eventId,
        status: "CONFIRMED",
        userId: {
          in: team.members.map((member) => member.userId),
        },
      },
    });

    if (confirmedCount !== team.members.length) {
      return NextResponse.json(
        { error: "All team members must confirm participation before locking." },
        { status: 400 },
      );
    }

    const requiredSkillNames = team.event.eventSkills.map(
      (eventSkill) => eventSkill.skill.name,
    );
    const availableSkillNames = new Set(
      team.members.flatMap((member) =>
        member.user.skills.map((userSkill) => userSkill.skill.name),
      ),
    );
    const missingSkills = requiredSkillNames.filter(
      (skillName) => !availableSkillNames.has(skillName),
    );

    if (missingSkills.length > 0) {
      return NextResponse.json(
        { error: `Missing required skills: ${missingSkills.join(", ")}` },
        { status: 400 },
      );
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { isLocked: true, isReady: true },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("LOCK TEAM ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
