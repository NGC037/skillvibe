import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await context.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Only team leader can view join requests
    if (team.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team leader can view join requests" },
        { status: 403 },
      );
    }

    const joinRequests = await prisma.teamJoinRequest.findMany({
      where: {
        teamId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(joinRequests);
  } catch (error) {
    console.error("GET JOIN REQUESTS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch join requests" },
      { status: 500 },
    );
  }
}
