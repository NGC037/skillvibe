import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ eventId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;

    /* =========================
       CHECK TEAM MEMBERSHIP
    ========================= */

    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: {
          eventId,
        },
      },
      include: {
        team: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not part of any team" },
        { status: 403 },
      );
    }

    if (!membership.team.isLocked) {
      return NextResponse.json(
        { error: "Team not locked yet" },
        { status: 403 },
      );
    }

    /* =========================
       FETCH EVENT
    ========================= */

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    /* =========================
       VALIDATE REGISTRATION
    ========================= */

    if (!event.externalLink) {
      return NextResponse.json(
        { error: "Registration link not available" },
        { status: 400 },
      );
    }

    if (!event.isRegistrationOpen) {
      return NextResponse.json(
        { error: "Registration not open" },
        { status: 403 },
      );
    }

    /* =========================
       SUCCESS
    ========================= */

    return NextResponse.json({
      externalLink: event.externalLink,
    });
  } catch (error) {
    console.error("REGISTRATION API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
 