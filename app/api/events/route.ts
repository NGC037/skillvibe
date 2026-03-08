import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        eventSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      minTeamSize: event.minTeamSize,
      maxTeamSize: event.maxTeamSize,
      requiredSkills: event.eventSkills.map(
        (es) => es.skill.name
      ),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
