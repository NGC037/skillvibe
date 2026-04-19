import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAssignableMembers,
  getWorkspaceAccessByTaskId,
} from "@/lib/workspace-access";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, assignedToId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const access = await getWorkspaceAccessByTaskId(session.user.email, taskId);

    if (!access) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!access.isLeader && !access.isAdmin) {
      return NextResponse.json(
        { error: "Only the team leader can reassign tasks." },
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

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: assignedToId || null,
      },
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error reassigning task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
