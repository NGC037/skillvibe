import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { Role } from "@prisma/client";

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

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ eventId: string }> },
) {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  const { eventId } = await props.params;

  if (!eventId) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.participation.deleteMany({ where: { eventId } });

      const teams = await tx.team.findMany({
        where: { eventId },
        select: { id: true },
      });

      const teamIds = teams.map((team) => team.id);

      if (teamIds.length > 0) {
        await tx.teamMember.deleteMany({
          where: { teamId: { in: teamIds } },
        });
      }

      await tx.team.deleteMany({ where: { eventId } });
      await tx.eventSkill.deleteMany({ where: { eventId } });
      await tx.certificate.updateMany({
        where: { eventId },
        data: {
          eventId: null,
          isSkillVibeEvent: false,
        },
      });
      await tx.event.delete({ where: { id: eventId } });
    });

    return NextResponse.json({ success: true });
  } catch (apiError) {
    console.error("CASCADE DELETE ERROR:", apiError);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ eventId: string }> },
) {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  const { eventId } = await props.params;

  if (!eventId) {
    return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
  }

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

    const startDate = registrationStart ? new Date(registrationStart) : null;
    const endDate = registrationEnd ? new Date(registrationEnd) : null;

    if (!title || !minTeamSize || !maxTeamSize || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Registration start must be before registration end" },
        { status: 400 },
      );
    }

    let posterUrl: string | undefined;
    if (posterFile instanceof File && posterFile.size > 0) {
      posterUrl = await savePoster(posterFile);
    }

    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: {
          title,
          description: description || null,
          minTeamSize,
          maxTeamSize,
          externalLink: registrationLink || null,
          registrationStartDate: startDate,
          registrationEndDate: endDate,
          posterUrl,
        },
      });

      await tx.eventSkill.deleteMany({ where: { eventId } });

      for (const skillName of requiredSkills) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });

        await tx.eventSkill.create({
          data: {
            eventId,
            skillId: skill.id,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (apiError) {
    console.error("UPDATE EVENT ERROR:", apiError);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 },
    );
  }
}
