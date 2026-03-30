import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { code },
      include: {
        members: true,
        event: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Invalid code" }, { status: 404 });
    }

    if (team.leaderId === session.user.id) {
      return NextResponse.json({ error: "You already lead this team." }, { status: 400 });
    }

    if (team.isLocked) {
      return NextResponse.json(
        { error: "Team is locked and cannot accept requests." },
        { status: 403 },
      );
    }

    if (team.members.length >= team.event.maxTeamSize) {
      return NextResponse.json(
        { error: "Team has reached maximum capacity." },
        { status: 403 },
      );
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
    });

    if (membership) {
      return NextResponse.json({ error: "You are already part of a team." }, { status: 409 });
    }

    const pendingRequest = await prisma.teamJoinRequest.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
        team: {
          eventId: team.eventId,
        },
      },
      include: {
        team: {
          select: {
            code: true,
          },
        },
      },
    });

    if (pendingRequest) {
      return NextResponse.json(
        {
          error: `You already have a pending request for team ${pendingRequest.team.code}.`,
        },
        { status: 409 },
      );
    }

    const existingRequest = await prisma.teamJoinRequest.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: session.user.id,
        },
      },
    });

    const joinRequest = existingRequest
      ? await prisma.teamJoinRequest.update({
          where: { id: existingRequest.id },
          data: { status: "PENDING" },
        })
      : await prisma.teamJoinRequest.create({
          data: {
            teamId: team.id,
            userId: session.user.id,
          },
        });

    await createNotification(
      team.leaderId,
      `${session.user.name ?? "A user"} requested to join your team ${team.code}.`,
      {
        type: "TEAM_REQUEST",
        requestId: joinRequest.id,
      },
    );

    return NextResponse.json({
      success: true,
      request: joinRequest,
      team: {
        id: team.id,
        code: team.code,
      },
    });
  } catch (error) {
    console.error("TEAM REQUEST ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
