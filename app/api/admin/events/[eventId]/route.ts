import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { Role } from "@prisma/client";

interface Params {
  params: { eventId: string };
}

/* ===========================
   DELETE EVENT (CASCADE)
=========================== */
export async function DELETE(
  req: Request,
  props: { params: Promise<{ eventId: string }> }
) {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  const { eventId } = await props.params;

  if (!eventId) {
    return NextResponse.json(
      { error: "Invalid event ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete participations
      await tx.participation.deleteMany({
        where: { eventId },
      });

      // Delete team members
      const teams = await tx.team.findMany({
        where: { eventId },
        select: { id: true },
      });

      const teamIds = teams.map((t) => t.id);

      if (teamIds.length > 0) {
        await tx.teamMember.deleteMany({
          where: { teamId: { in: teamIds } },
        });
      }

      // Delete teams
      await tx.team.deleteMany({
        where: { eventId },
      });

      // Delete event skills
      await tx.eventSkill.deleteMany({
        where: { eventId },
      });

      // Finally delete event
      await tx.event.delete({
        where: { id: eventId },
      });
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("CASCADE DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

/* ===========================
   UPDATE EVENT (FULL)
=========================== */
export async function PATCH(
  req: Request,
  props: { params: Promise<{ eventId: string }> }
) {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  const { eventId } = await props.params;

  if (!eventId) {
    return NextResponse.json(
      { error: "Invalid event ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      minTeamSize,
      maxTeamSize,
      requiredSkills,
    } = body;

    await prisma.$transaction(async (tx) => {
      // Update basic fields
      await tx.event.update({
        where: { id: eventId },
        data: {
          title,
          description,
          minTeamSize,
          maxTeamSize,
        },
      });

      // Remove existing skill links
      await tx.eventSkill.deleteMany({
        where: { eventId },
      });

      // Re-create skill links
      if (requiredSkills && requiredSkills.length > 0) {
        await tx.eventSkill.createMany({
          data: requiredSkills.map((skillName: string) => ({
            eventId,
            skillId: undefined, // handled below
          })),
        });

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
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("UPDATE EVENT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}