import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessByProjectId } from "@/lib/workspace-access";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, content } = body;
    const normalizedContent = typeof content === "string" ? content.trim() : "";

    if (!projectId || !normalizedContent) {
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

    const hasAssignedTask = await prisma.task.findFirst({
      where: {
        projectId,
        assignedToId: access.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!access.isLeader && !access.isAdmin && !hasAssignedTask) {
      return NextResponse.json(
        { error: "You can only post logs after receiving an assigned task." },
        { status: 403 },
      );
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentLog = await prisma.progressLog.findFirst({
      where: {
        projectId,
        userId: access.user.id,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (recentLog) {
      return NextResponse.json(
        { error: "Please wait before posting another progress update." },
        { status: 429 },
      );
    }

    const log = await prisma.progressLog.create({
      data: {
        projectId,
        userId: access.user.id,
        content: normalizedContent,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating log:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
