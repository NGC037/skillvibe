import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET participations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const participations = await prisma.participation.findMany({
      where: { userId: session.user.id },
      include: {
        event: true,
      },
    });

    return NextResponse.json(participations);
  } catch (error) {
    console.error("PARTICIPATION GET ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// POST participation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { eventId } = await request.json();

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        maxParticipants: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (event.maxParticipants) {
      const participantCount = await prisma.participation.count({
        where: {
          eventId,
        },
      });

      const existingParticipation = await prisma.participation.findUnique({
        where: {
          userId_eventId: {
            userId: session.user.id,
            eventId,
          },
        },
        select: { id: true },
      });

      if (!existingParticipation && participantCount >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Event has reached its participant limit" },
          { status: 403 }
        );
      }
    }

    await prisma.participation.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      update: {
        status: "CONFIRMED",
      },
      create: {
        userId: session.user.id,
        eventId,
        status: "CONFIRMED",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PARTICIPATION POST ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
