import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, description, assignedToId } = body;
    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";

    if (!projectId || !normalizedTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
            members: true,
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

    if (assignedToId) {
      const isAssignableUser =
        project.team.leaderId === assignedToId ||
        project.team.members.some((member) => member.userId === assignedToId);

      if (!isAssignableUser) {
        return NextResponse.json(
          { error: "Task can only be assigned to team members." },
          { status: 400 },
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title: normalizedTitle,
        description: normalizedDescription || null,
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
