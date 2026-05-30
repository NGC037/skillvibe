import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ParticipationStatus } from "@prisma/client";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode();
    const existing = await prisma.team.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("Unable to generate team code");
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const { eventId } = await context.params;
    const session = await getServerSession(authOptions);

    const teams = await prisma.team.findMany({
      where: { eventId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        joinRequests: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
              select: {
                id: true,
                status: true,
              },
            }
          : false,
      },
    });

    return NextResponse.json(
      teams.map((team) => ({
        ...team,
        currentUserRequestStatus:
          Array.isArray(team.joinRequests) && team.joinRequests.length > 0
            ? team.joinRequests[0].status
            : null,
      })),
    );
  } catch (error) {
    console.error("GET TEAMS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    const normalizedName = typeof name === "string" ? name.trim() : "";

    if (!normalizedName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { eventId } = await context.params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, minTeamSize: true, maxTeamSize: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      select: { status: true },
    });

    if (participation?.status !== ParticipationStatus.CONFIRMED) {
      return NextResponse.json(
        { error: "Confirm participation before creating a team." },
        { status: 403 },
      );
    }

    const existingTeam = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: { eventId },
      },
      select: { id: true },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: "You are already part of a team for this event." },
        { status: 409 },
      );
    }

    const code = await generateUniqueCode();

    const team = await prisma.team.create({
      data: {
        name: normalizedName,
        code,
        event: {
          connect: { id: eventId },
        },
        leader: {
          connect: { id: session.user.id },
        },
        members: {
          create: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    const updatedTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: true,
        event: true,
      },
    });

    if (!updatedTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isReady = updatedTeam.members.length >= updatedTeam.event.minTeamSize;

    await prisma.team.update({
      where: { id: team.id },
      data: { isReady },
    });

    const newStatus = isReady
      ? ParticipationStatus.CONFIRMED
      : ParticipationStatus.PENDING;

    await prisma.participation.updateMany({
      where: {
        eventId: updatedTeam.eventId,
        userId: {
          in: updatedTeam.members.map((member) => member.userId),
        },
      },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json({
      ...team,
      teamId: team.id,
    });
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
