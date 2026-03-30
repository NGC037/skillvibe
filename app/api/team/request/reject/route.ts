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
    const requestId = typeof body.requestId === "string" ? body.requestId : "";

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const joinRequest = await prisma.teamJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        team: {
          select: { leaderId: true, code: true },
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

    await prisma.teamJoinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });

    await createNotification(
      joinRequest.userId,
      `Your request to join team ${joinRequest.team.code} was rejected.`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("REJECT TEAM REQUEST ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
