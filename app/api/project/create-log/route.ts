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
    const { projectId, content } = body;
    const normalizedContent = typeof content === "string" ? content.trim() : "";

    if (!projectId || !normalizedContent) {
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

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentLog = await prisma.progressLog.findFirst({
      where: {
        projectId,
        userId: user.id,
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
        userId: user.id,
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
