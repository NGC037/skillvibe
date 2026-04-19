import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ParticipationStatus } from "@prisma/client";

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;

    const participation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (!participation) {
      return NextResponse.json(
        { status: null, message: "Not participated" },
        { status: 200 },
      );
    }

    // Get user's team for this event
    const userTeam = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: {
          eventId,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            code: true,
            name: true,
            leaderId: true,
            isLocked: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: participation.status,
      teamId: userTeam?.team.id || null,
      teamCode: userTeam?.team.code || null,
      teamName: userTeam?.team.name || null,
      teamLeaderId: userTeam?.team.leaderId || null,
      teamLocked: userTeam?.team.isLocked || false,
      message: "Participation retrieved",
    });
  } catch (error) {
    console.error("GET PARTICIPATION ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch participation" },
      { status: 500 },
    );
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

    const { eventId } = await context.params;
    const { action } = await request.json();

    if (!action || !["INTERESTED", "CONFIRMED"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be INTERESTED or CONFIRMED" },
        { status: 400 },
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existingParticipation = await prisma.participation.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    // Check max participants if confirming
    if (action === "CONFIRMED" && event.maxParticipants) {
      const confirmedCount = await prisma.participation.count({
        where: {
          eventId,
          status: ParticipationStatus.CONFIRMED,
        },
      });

      if (
        confirmedCount >= event.maxParticipants &&
        (!existingParticipation ||
          existingParticipation.status !== ParticipationStatus.CONFIRMED)
      ) {
        return NextResponse.json(
          { error: "Event has reached maximum participants" },
          { status: 403 },
        );
      }
    }

    const participation = await prisma.participation.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      update: {
        status: action as ParticipationStatus,
      },
      create: {
        userId: session.user.id,
        eventId,
        status: action as ParticipationStatus,
      },
    });

    return NextResponse.json({
      success: true,
      status: participation.status,
      message: `Successfully marked as ${action}`,
    });
  } catch (error) {
    console.error("UPDATE PARTICIPATION ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update participation" },
      { status: 500 },
    );
  }
}
