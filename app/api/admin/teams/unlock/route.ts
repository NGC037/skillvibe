import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const teamId = formData.get("teamId") as string;

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

    await prisma.team.update({
      where: { id: teamId },
      data: { isLocked: false },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("ADMIN UNLOCK ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}