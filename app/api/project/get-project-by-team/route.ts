import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessByProjectId } from "@/lib/workspace-access";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 },
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true, leader: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isMember =
      team.members.some((member) => member.userId === session.user.id) ||
      team.leaderId === session.user.id;

    if (!isMember && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { teamId },
      include: {
        owner: true,
        team: true,
        tasks: {
          include: {
            assignedTo: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    const access = await getWorkspaceAccessByProjectId(
      session.user.email,
      project.id,
    );

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      {
        ...project,
        tasks:
          access.isLeader || access.isAdmin
            ? project.tasks
            : project.tasks.filter((task) => task.assignedToId === access.user.id),
        currentViewer: {
          id: access.user.id,
          canManageTasks: access.isLeader || access.isAdmin,
          canViewAllTasks: access.isLeader || access.isAdmin,
          canViewAllLogs: access.isLeader || access.isAdmin,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
