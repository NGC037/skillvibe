import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAssignableMembers,
  getWorkspaceAccessByProjectId,
} from "@/lib/workspace-access";

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

    const access = await getWorkspaceAccessByProjectId(
      session.user.email,
      projectId,
    );

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!access.isLeader && !access.isAdmin) {
      return NextResponse.json(
        { error: "Only the team leader can create and assign tasks." },
        { status: 403 },
      );
    }

    const assignableMembers = getAssignableMembers(access);
    const isAssignableUser = assignedToId
      ? assignableMembers.some((member) => member.id === assignedToId)
      : true;

    if (!isAssignableUser) {
      return NextResponse.json(
        { error: "Task can only be assigned to team members." },
        { status: 400 },
      );
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
