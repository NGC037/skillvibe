import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ParticipationStatus } from "@prisma/client";
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
    const requestId = typeof body.requestId === "string" ? body.requestId : "";

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: {
          include: {
            members: true,
            event: true,
          },
        },
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (joinRequest.team.leaderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (joinRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 });
    }

    if (joinRequest.team.isLocked) {
      return NextResponse.json(
        { error: "Team is locked and cannot accept new members." },
        { status: 403 },
      );
    }

    if (joinRequest.team.members.length >= joinRequest.team.event.maxTeamSize) {
      return NextResponse.json(
        { error: "Team has reached maximum capacity." },
        { status: 403 },
      );
    }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: joinRequest.userId },
    });

    if (membership) {
      return NextResponse.json({ error: "User is already part of a team." }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.teamMember.create({
        data: {
          teamId: joinRequest.teamId,
          userId: joinRequest.userId,
        },
      });

      await tx.teamJoinRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      });

      await tx.teamJoinRequest.updateMany({
        where: {
          userId: joinRequest.userId,
          status: "PENDING",
          team: {
            eventId: joinRequest.team.eventId,
          },
        },
        data: { status: "REJECTED" },
      });

      const updatedTeam = await tx.team.findUnique({
        where: { id: joinRequest.teamId },
        include: {
          members: true,
          event: true,
        },
      });

      if (!updatedTeam) {
        throw new Error("Team not found after approval");
      }

      const isReady = updatedTeam.members.length >= updatedTeam.event.minTeamSize;

      await tx.team.update({
        where: { id: joinRequest.teamId },
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

    await createNotification(
      joinRequest.userId,
      `Your request to join team ${joinRequest.team.code} was approved.`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("APPROVE TEAM REQUEST ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
