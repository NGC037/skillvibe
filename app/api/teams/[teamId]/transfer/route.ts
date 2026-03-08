import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const { newLeaderId } = await request.json();

    if (!newLeaderId) {
      return NextResponse.json(
        { error: "New leader required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Only current leader can transfer
    if (team.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "Only leader can transfer leadership" },
        { status: 403 }
      );
    }

    // Target must be member
    const isMember = team.members.some(
      (m) => m.userId === newLeaderId
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "User is not in team" },
        { status: 400 }
      );
    }

    if (newLeaderId === team.leaderId) {
      return NextResponse.json(
        { error: "Already leader" },
        { status: 400 }
      );
    }

    await prisma.team.update({
      where: { id: teamId },
      data: {
        leaderId: newLeaderId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("TRANSFER ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}