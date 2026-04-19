import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventTimelineStatus, type EventTimelineStatus } from "@/lib/events";

const validStatuses = new Set<EventTimelineStatus>(["ONGOING", "UPCOMING", "PAST"]);

export async function GET(req: NextRequest) {
  try {
    const statusParam = req.nextUrl.searchParams.get("status");
    const requestedStatus =
      statusParam && validStatuses.has(statusParam as EventTimelineStatus)
        ? (statusParam as EventTimelineStatus)
        : null;

    const events = await prisma.event.findMany({
      include: {
        eventSkills: {
          include: {
            skill: true,
          },
        },
      },
      orderBy: [{ registrationStartDate: "asc" }, { createdAt: "desc" }],
    });

    const formattedEvents = events
      .map((event) => {
        const timelineStatus = getEventTimelineStatus({
          registrationStartDate: event.registrationStartDate,
          registrationEndDate: event.registrationEndDate,
        });

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          minTeamSize: event.minTeamSize,
          maxTeamSize: event.maxTeamSize,
          posterUrl: event.posterUrl,
          externalLink: event.externalLink,
          registrationStartDate: event.registrationStartDate?.toISOString() ?? null,
          registrationEndDate: event.registrationEndDate?.toISOString() ?? null,
          requiredSkills: event.eventSkills.map((eventSkill) => eventSkill.skill.name),
          timelineStatus,
        };
      })
      .filter((event) =>
        requestedStatus ? event.timelineStatus === requestedStatus : event.timelineStatus !== "PAST",
      );

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("EVENTS API ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
