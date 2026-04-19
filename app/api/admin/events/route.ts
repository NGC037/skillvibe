import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { Role } from "@prisma/client";
import { getEventTimelineStatus } from "@/lib/events";

async function savePoster(file: File) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "event-posters");
  await mkdir(uploadDir, { recursive: true });

  const extension = path.extname(file.name) || ".png";
  const filename = `${randomUUID()}${extension}`;
  const absolutePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return `/uploads/event-posters/${filename}`;
}

export async function GET() {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  try {
    const events = await prisma.event.findMany({
      include: {
        eventSkills: {
          include: { skill: true },
        },
        participations: true,
        teams: {
          include: {
            project: {
              include: {
                tasks: true,
              },
            },
          },
        },
      },
      orderBy: {
        registrationStartDate: "desc",
      },
    });

    const enrichedEvents = events.map((event) => {
      const participantsCount = event.participations.length;
      const activeTeams = event.teams.length;

      const taskSets = event.teams.flatMap((team) => team.project?.tasks ?? []);
      const completedTasks = taskSets.filter((task) => task.status === "DONE").length;
      const completionRate =
        taskSets.length === 0 ? 0 : Math.round((completedTasks / taskSets.length) * 100);

      return {
        ...event,
        timelineStatus: getEventTimelineStatus({
          registrationStartDate: event.registrationStartDate,
          registrationEndDate: event.registrationEndDate,
        }),
        analytics: {
          participantsCount,
          activeTeams,
          completionRate,
        },
      };
    });

    return NextResponse.json({ success: true, events: enrichedEvents });
  } catch (apiError) {
    console.error("ADMIN GET EVENTS ERROR:", apiError);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  try {
    const formData = await req.formData();
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const minTeamSize = Number(formData.get("minTeamSize") ?? 0);
    const maxTeamSize = Number(formData.get("maxTeamSize") ?? 0);
    const registrationStart = String(formData.get("registrationStart") ?? "").trim();
    const registrationEnd = String(formData.get("registrationEnd") ?? "").trim();
    const registrationLink = String(formData.get("officialRegistrationLink") ?? "").trim();
    const requiredSkills = formData.getAll("requiredSkills").map(String).filter(Boolean);
    const posterFile = formData.get("eventPoster");

    if (!title || !minTeamSize || !maxTeamSize || !registrationStart || !registrationEnd) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const startDate = new Date(registrationStart);
    const endDate = new Date(registrationEnd);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid registration date values" },
        { status: 400 },
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Registration start must be before registration end" },
        { status: 400 },
      );
    }

    let posterUrl: string | null = null;

    if (posterFile instanceof File && posterFile.size > 0) {
      posterUrl = await savePoster(posterFile);
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        minTeamSize,
        maxTeamSize,
        externalLink: registrationLink || null,
        registrationStartDate: startDate,
        registrationEndDate: endDate,
        posterUrl,
        isRegistrationOpen: true,
        eventSkills: requiredSkills.length
          ? {
              create: requiredSkills.map((skillName) => ({
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
  } catch (apiError) {
    console.error("ADMIN CREATE EVENT ERROR:", apiError);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
