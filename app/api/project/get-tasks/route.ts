import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessByProjectId } from "@/lib/workspace-access";

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

    const access = await getWorkspaceAccessByProjectId(
      session.user.email,
      projectId,
    );

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where:
        access.isLeader || access.isAdmin
          ? { projectId }
          : { projectId, assignedToId: access.user.id },
      include: {
        assignedTo: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        tasks,
        canManageTasks: access.isLeader || access.isAdmin,
        canViewAllTasks: access.isLeader || access.isAdmin,
        currentUserId: access.user.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
