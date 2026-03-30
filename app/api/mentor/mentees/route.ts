import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== Role.MENTOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mentees = await prisma.mentorMentee.findMany({
      where: { mentorId: session.user.id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            year: true,
            division: true,
            skills: {
              select: {
                skill: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return NextResponse.json({
      mentees: mentees.map((entry) => ({
        id: entry.student.id,
        name: entry.student.name,
        email: entry.student.email,
        department: entry.student.department,
        year: entry.student.year,
        division: entry.student.division,
        skills: entry.student.skills
          .map((skillEntry) => skillEntry.skill)
          .filter(
            (skill): skill is { id: string; name: string } =>
              Boolean(skill?.id && skill?.name),
          ),
      })),
    });
  } catch (error) {
    console.error("GET MENTEES ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
