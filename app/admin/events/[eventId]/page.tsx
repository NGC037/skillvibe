import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import Link from "next/link";
import AnimatedCard from "@/components/ui/AnimatedCard";
import RegistrationControl from "@/components/admin/RegistrationControl";

export default async function EventAnalyticsPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  if (session.user.role !== Role.ADMIN) redirect("/dashboard");

  const { eventId } = await props.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventSkills: {
        include: { skill: true },
      },
      teams: {
        include: { members: true },
      },
    },
  });

  if (!event) redirect("/admin");

  const totalParticipations = await prisma.participation.count({
    where: { eventId },
  });

  const confirmedParticipations = await prisma.participation.count({
    where: {
      eventId,
      status: "CONFIRMED",
    },
  });

  const pendingParticipations = await prisma.participation.count({
    where: {
      eventId,
      status: "PENDING",
    },
  });

  const totalTeams = await prisma.team.count({
    where: { eventId },
  });

  const confirmationPercent =
    totalParticipations === 0
      ? 0
      : Math.round((confirmedParticipations / totalParticipations) * 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* HEADER */}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{event.title}</h1>

          <p className="text-neutral-500 mt-2">
            Governance analytics and participation insights
          </p>
        </div>

        <Link
          href="/admin"
          className="text-indigo-600 font-medium hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* REQUIRED SKILLS */}

      {event.eventSkills.length > 0 && (
        <AnimatedCard>
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Required Skills</h2>

            <div className="flex flex-wrap gap-3">
              {event.eventSkills.map((es) => (
                <span
                  key={es.skill.id}
                  className="text-xs bg-linear-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full"
                >
                  {es.skill.name}
                </span>
              ))}
            </div>
          </div>
        </AnimatedCard>
      )}

      {/* METRICS */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Participations",
            value: totalParticipations,
          },
          {
            label: "Confirmed",
            value: confirmedParticipations,
          },
          {
            label: "Pending",
            value: pendingParticipations,
          },
          {
            label: "Total Teams",
            value: totalTeams,
          },
        ].map((metric) => (
          <AnimatedCard key={metric.label}>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-neutral-500">{metric.label}</p>

              <p className="text-3xl font-bold mt-2 text-neutral-900">
                {metric.value}
              </p>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* CONFIRMATION HEALTH */}

      <AnimatedCard>
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Confirmation Ratio</h2>

          <div className="w-full bg-neutral-100 rounded-full h-3">
            <div
              className={`bg-linear-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ${
                confirmationPercent >= 75
                  ? "w-3/4"
                  : confirmationPercent >= 50
                    ? "w-1/2"
                    : confirmationPercent >= 25
                      ? "w-1/4"
                      : "w-[8%]"
              }`}
            />
          </div>

          <p className="text-sm text-neutral-500 mt-3">
            {confirmationPercent}% confirmed
          </p>
        </div>
      </AnimatedCard>

      {/* TEAMS GOVERNANCE */}

      <AnimatedCard>
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Teams Governance</h2>

          <div className="space-y-4">
            {event.teams.length === 0 && (
              <p className="text-neutral-500 text-sm">No teams created yet.</p>
            )}

            {event.teams.map((team) => (
              <div
                key={team.id}
                className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    Team ID: {team.id.slice(0, 8)}
                  </span>

                  {team.isLocked && (
                    <span className="text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">
                      LOCKED
                    </span>
                  )}
                </div>

                {team.isLocked && (
                  <form action="/api/admin/teams/unlock" method="POST">
                    <input type="hidden" name="teamId" value={team.id} />
                    <button
                      type="submit"
                      className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200"
                    >
                      Unlock Team
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </AnimatedCard>

      <RegistrationControl eventId={eventId} />
    </div>
  );
}
