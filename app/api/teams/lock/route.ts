import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
const teamId = formData.get("teamId") as string;;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID required" },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Only leader can lock
    if (team.leaderId !== session.user.id) {
      return NextResponse.json(
        { error: "Only team leader can lock this team." },
        { status: 403 }
      );
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { isLocked: true },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("LOCK TEAM ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}