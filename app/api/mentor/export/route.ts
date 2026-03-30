import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string | number | null | undefined) {
  const normalized = value == null ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

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
            name: true,
            email: true,
            department: true,
            year: true,
            division: true,
            skills: {
              select: {
                skill: {
                  select: {
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

    const rows = [
      ["Name", "Email", "Department", "Year", "Division", "Skills"],
      ...mentees.map((entry) => [
        entry.student.name ?? "",
        entry.student.email,
        entry.student.department ?? "",
        entry.student.year ?? "",
        entry.student.division ?? "",
        entry.student.skills.map((skillEntry) => skillEntry.skill.name).join(", "),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
      .join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mentor-mentees.csv"',
      },
    });
  } catch (error) {
    console.error("EXPORT MENTOR MENTEES ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
