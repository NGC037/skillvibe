import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { Role } from "@prisma/client";

/* ===========================
   GET - List all events
=========================== */
export async function GET() {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  try {
    const events = await prisma.event.findMany({
      include: {
        eventSkills: {
          include: { skill: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error("ADMIN GET EVENTS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/* ===========================
   POST - Create new event
=========================== */
export async function POST(req: Request) {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  try {
    const body = await req.json();

    const {
      title,
      description,
      minTeamSize,
      maxTeamSize,
      requiredSkills,
    } = body;

    if (!title || !minTeamSize || !maxTeamSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        minTeamSize,
        maxTeamSize,
        eventSkills: requiredSkills?.length
          ? {
              create: requiredSkills.map((skillName: string) => ({
                skill: {
                  connectOrCreate: {
                    where: { name: skillName },
                    create: { name: skillName },
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        eventSkills: {
          include: { skill: true },
        },
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error("ADMIN CREATE EVENT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}