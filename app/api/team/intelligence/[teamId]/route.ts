import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        leaderId: true,
        members: {
          select: {
            userId: true,
            user: {
              select: {
                skills: {
                  select: {
                    skill: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        event: {
          select: {
            eventSkills: {
              select: {
                skill: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isMember =
      team.leaderId === session.user.id ||
      team.members.some((member) => member.userId === session.user.id);

    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teamSkillsSet = new Set(
      team.members.flatMap((member) =>
        member.user.skills
          .map((userSkill) => userSkill.skill?.name)
          .filter((skillName): skillName is string => Boolean(skillName)),
      ),
    );

    const requiredSkills = team.event.eventSkills
      .map((eventSkill) => eventSkill.skill?.name)
      .filter((skillName): skillName is string => Boolean(skillName));

    const teamSkills = Array.from(teamSkillsSet).sort((a, b) =>
      a.localeCompare(b),
    );
    const missingSkills = requiredSkills.filter(
      (skillName) => !teamSkillsSet.has(skillName),
    );
    const matchedCount = requiredSkills.length - missingSkills.length;
    const matchScore =
      requiredSkills.length === 0
        ? 100
        : Math.round((matchedCount / requiredSkills.length) * 100);

    return NextResponse.json({
      matchScore,
      missingSkills,
      teamSkills,
    });
  } catch (error) {
    console.error("TEAM INTELLIGENCE ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
