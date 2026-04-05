import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ParticipationStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();

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

    const existingMembership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already part of a team." },
        { status: 409 },
      );
    }

    const approvedJoinRequest = await prisma.teamJoinRequest.findUnique({
      where: {
        teamId_userId: {
          teamId: team.id,
          userId: session.user.id,
        },
      },
    });

    if (!approvedJoinRequest || approvedJoinRequest.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Leader approval is required before joining this team." },
        { status: 403 },
      );
    }

    if (team.isLocked) {
      return NextResponse.json(
        { error: "Team is locked and cannot accept new members." },
        { status: 403 },
      );
    }

    if (team.members.length >= team.event.maxTeamSize) {
      return NextResponse.json(
        { error: "Team has reached maximum capacity." },
        { status: 403 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: session.user.id,
        },
      });

      const updatedTeam = await tx.team.findUnique({
        where: { id: team.id },
        include: {
          members: true,
          event: true,
        },
      });

      if (!updatedTeam) {
        throw new Error("Team not found after join");
      }

      const isReady = updatedTeam.members.length >= updatedTeam.event.minTeamSize;

      await tx.team.update({
        where: { id: team.id },
        data: {
          isReady,
          isLocked: updatedTeam.members.length >= updatedTeam.event.maxTeamSize,
        },
      });

      const newStatus = isReady
        ? ParticipationStatus.CONFIRMED
        : ParticipationStatus.PENDING;

      await tx.participation.updateMany({
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
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("JOIN TEAM ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
