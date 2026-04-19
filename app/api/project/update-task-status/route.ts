import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkTaskOwnership,
  getWorkspaceAccessByTaskId,
} from "@/lib/workspace-access";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, status } = body;

    if (!taskId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const access = await getWorkspaceAccessByTaskId(session.user.email, taskId);

    if (!access) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!checkTaskOwnership(access)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const allowedTransitions: Record<string, string[]> = {
      TODO: ["IN_PROGRESS"],
      IN_PROGRESS: ["DONE"],
      DONE: [],
    };

    if (
      !access.isLeader &&
      !access.isAdmin &&
      !allowedTransitions[access.task.status]?.includes(status)
    ) {
      return NextResponse.json(
        { error: "Invalid task status transition" },
        { status: 400 },
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: access.task.id },
      data: {
        status,
        completedAt: status === "DONE" ? new Date() : null,
      },
      include: {
        assignedTo: true,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
