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

  const teams = await prisma.team.findMany({
    include: {
      event: {
        include: {
          eventSkills: {
            include: {
              skill: true,
            },
          },
        },
      },
      members: {
        include: {
          user: {
            include: {
              skills: {
                include: {
                  skill: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ event: { title: "asc" } }, { createdAt: "asc" }],
  });

  const header = ["Team Name", "Members", "Match Score"];
  const rows = teams.map((team) => {
    const teamSkillSet = new Set(
      team.members.flatMap((member) =>
        member.user.skills.map((userSkill) => userSkill.skill.name),
      ),
    );

    const requiredSkills = team.event.eventSkills.map((eventSkill) => eventSkill.skill.name);
    const matchedCount = requiredSkills.filter((skill) => teamSkillSet.has(skill)).length;
    const matchScore =
      requiredSkills.length === 0
        ? 100
        : Math.round((matchedCount / requiredSkills.length) * 100);

    return [
      team.name ?? `${team.event.title} (${team.code})`,
      team.members
        .map((member) => member.user.name ?? member.user.email)
        .join(" | "),
      String(matchScore),
    ]
      .map((value) => escapeCsv(value))
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="teams-export.csv"',
    },
  });
}
