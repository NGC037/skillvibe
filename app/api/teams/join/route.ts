import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ParticipationStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Code required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { code },
      include: {
        members: true,
        event: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 404 }
      );
    }

    // 🔒 Structural Lock Check

    if (team.isLocked) {
      return NextResponse.json(
        { error: "Team is locked and cannot accept new members." },
        { status: 403 }
      );
    }

    if (team.members.length >= team.event.maxTeamSize) {
      return NextResponse.json(
        { error: "Team has reached maximum capacity." },
        { status: 403 }
      );
    }

    // ✅ Create team member

    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
      },
    });

    // 🔄 Recalculate readiness

    const updatedTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        members: true,
        event: true,
      },
    });

    if (!updatedTeam) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const isReady =
      updatedTeam.members.length >=
      updatedTeam.event.minTeamSize;

    await prisma.team.update({
      where: { id: team.id },
      data: { isReady },
    });

    // 🔒 Auto-lock if max size reached

    if (
      updatedTeam.members.length >=
      updatedTeam.event.maxTeamSize
    ) {
      await prisma.team.update({
        where: { id: team.id },
        data: { isLocked: true },
      });
    }

    // Update participation status

    const newStatus = isReady
      ? ParticipationStatus.CONFIRMED
      : ParticipationStatus.PENDING;

    await prisma.participation.updateMany({
      where: {
        eventId: updatedTeam.eventId,
        userId: {
          in: updatedTeam.members.map(
            (m: { userId: string }) => m.userId
          ),
        },
      },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("JOIN TEAM ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}