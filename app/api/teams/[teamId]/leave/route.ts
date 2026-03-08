import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ParticipationStatus } from "@prisma/client";

export async function POST(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { teamId } = await context.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        event: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const isMember = team.members.some(
      (m) => m.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "Not a team member" },
        { status: 403 }
      );
    }

    // Remove user from team
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: session.user.id,
        },
      },
    });

    // Refresh members
    const updatedTeam = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true, event: true },
    });

    if (!updatedTeam) {
      return NextResponse.json({ success: true });
    }

    // If leader left → promote first remaining member
    if (team.leaderId === session.user.id) {
      if (updatedTeam.members.length > 0) {
        await prisma.team.update({
          where: { id: teamId },
          data: {
            leaderId: updatedTeam.members[0].userId,
          },
        });
      }
    }

    // If no members left → delete team
    if (updatedTeam.members.length === 0) {
      await prisma.team.delete({
        where: { id: teamId },
      });

      return NextResponse.json({ success: true });
    }
    // Downgrade leaving user participation
await prisma.participation.updateMany({
  where: {
    eventId: team.eventId,
    userId: session.user.id,
  },
  data: {
    status: ParticipationStatus.PENDING,
  },
});

    // Recalculate readiness
    const isReady =
      updatedTeam.members.length >=
      updatedTeam.event.minTeamSize;

    await prisma.team.update({
      where: { id: teamId },
      data: { isReady },
    });

    const newStatus = isReady
      ? ParticipationStatus.CONFIRMED
      : ParticipationStatus.PENDING;

    await prisma.participation.updateMany({
      where: {
        eventId: updatedTeam.eventId,
        userId: {
          in: updatedTeam.members.map(
            (m) => m.userId
          ),
        },
      },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LEAVE TEAM ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}