import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ParticipationStatus } from "@prisma/client";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// GET teams for event
export async function GET(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    const teams = await prisma.team.findMany({
  where: { eventId },
  include: {
    members: {
      include: {
        user: true,  // 🔥 important
      },
    },
  },
});

    return NextResponse.json(teams);
  } catch (error) {
    console.error("GET TEAMS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// CREATE TEAM
export async function POST(
  request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { eventId } = await context.params;

    const code = generateCode();

    // ✅ FIX 1: Use relation connect instead of leaderId
    const team = await prisma.team.create({
      data: {
        name,
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

    // ✅ FIX 2: Readiness logic INSIDE POST function
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

    const isReady =
      updatedTeam.members.length >= updatedTeam.event.minTeamSize;

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
          in: updatedTeam.members.map((m) => m.userId),
        },
      },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}