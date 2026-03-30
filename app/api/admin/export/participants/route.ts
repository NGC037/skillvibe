import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }

  return value;
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const participations = await prisma.participation.findMany({
    include: {
      event: true,
      user: {
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
          teamMembers: {
            include: {
              team: {
                select: {
                  name: true,
                  code: true,
                  eventId: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ event: { title: "asc" } }, { user: { name: "asc" } }],
  });

  const header = ["Name", "Email", "Skills", "Team", "Event"];
  const rows = participations.map((participation) => {
    const teamMembership = participation.user.teamMembers.find(
      (membership) => membership.team.eventId === participation.eventId,
    );

    return [
      participation.user.name ?? "Unknown User",
      participation.user.email,
      participation.user.skills.map((skill) => skill.skill.name).join(" | "),
      teamMembership?.team.name ?? teamMembership?.team.code ?? "No Team",
      participation.event.title,
    ]
      .map((value) => escapeCsv(String(value)))
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="participants-export.csv"',
    },
  });
}
