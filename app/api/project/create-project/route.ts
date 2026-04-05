import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/project/create-project
 * Creates a project for a team (only if team is locked)
 * Only team leader or admin can create
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      teamId,
      title,
      shortDescription,
      fullDescription,
      architecture,
      totalPhases,
    } = body;

    if (
      !teamId ||
      !title ||
      !shortDescription ||
      typeof totalPhases !== "number"
    ) {
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

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { leader: true, members: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is team leader or admin
    if (team.leaderId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only team leader or admin can create project" },
        { status: 403 },
      );
    }

    // Check if team is locked
    if (!team.isLocked) {
      return NextResponse.json(
        { error: "Team must be locked to create workspace project" },
        { status: 400 },
      );
    }

    // Check if project already exists
    const existingProject = await prisma.project.findUnique({
      where: { teamId },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "Team already has a workspace project" },
        { status: 400 },
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        title,
        shortDescription,
        fullDescription: fullDescription || null,
        architecture: architecture || null,
        totalPhases,
        ownerId: user.id,
        teamId,
      },
      include: {
        owner: true,
        team: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
