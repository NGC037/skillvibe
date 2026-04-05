import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ContributionData {
  userId: string;
  userName: string | null;
  tasksCompleted: number;
  logsCreated: number;
  score: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
            leader: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.team) {
      return NextResponse.json(
        { error: "Project is not associated with a team" },
        { status: 400 },
      );
    }

    const isMember =
      project.team.members.some((member) => member.userId === user.id) ||
      project.team.leaderId === user.id;
    if (!isMember && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const teamMemberIds = [
      project.team.leaderId,
      ...project.team.members.map((member) => member.userId),
    ];
    const uniqueMemberIds = Array.from(new Set(teamMemberIds));

    const contributions: ContributionData[] = [];

    for (const memberId of uniqueMemberIds) {
      const member = await prisma.user.findUnique({
        where: { id: memberId },
      });

      if (!member) continue;

      const tasksCompleted = await prisma.task.count({
        where: {
          projectId,
          assignedToId: memberId,
          status: "DONE",
        },
      });

      const logsCreated = await prisma.progressLog.count({
        where: {
          projectId,
          userId: memberId,
        },
      });

      const effectiveLogs = Math.min(logsCreated, tasksCompleted + 2);
      const score = tasksCompleted * 10 + effectiveLogs * 3;

      contributions.push({
        userId: memberId,
        userName: member.name,
        tasksCompleted,
        logsCreated,
        score,
      });
    }

    contributions.sort((a, b) => b.score - a.score);

    return NextResponse.json(contributions, { status: 200 });
  } catch (error) {
    console.error("Error calculating contributions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
