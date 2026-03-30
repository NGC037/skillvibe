import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeleteEventButton from "@/components/admin/DeleteEventButton";
import Link from "next/link";
import { calculateConfirmationRatio } from "@/lib/readiness";
import MotionWrapper from "@/components/ui/MotionWrapper";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AdminAnalyticsChart from "@/components/admin/AdminAnalyticsChart";
import EventHealthChart from "@/components/admin/EventHealthChart";
import AppLayout from "@/components/layout/AppLayout";

type RecentEvent = {
  id: string;
  title: string;
  minTeamSize: number;
  maxTeamSize: number;
  createdAt: Date;
  eventSkills: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
  participations: Array<{
    status: string;
  }>;
};

type EnrichedRecentEvent = RecentEvent & {
  totalParticipations: number;
  confirmedCount: number;
  confirmationPercentage: number;
  eventLockEligible: boolean;
  lockWarning: boolean;
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  console.log("SESSION:", session);

  if (!session) {
    redirect("/login");
  }

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const totalEvents = await prisma.event.count();
  const totalParticipations = await prisma.participation.count();
  const confirmedParticipations = await prisma.participation.count({
    where: { status: "CONFIRMED" },
  });
  const pendingParticipations = await prisma.participation.count({
    where: { status: "PENDING" },
  });
  const totalTeams = await prisma.team.count();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentEventCount = await prisma.event.count({
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const recentEvents = await prisma.event.findMany({
    include: {
      eventSkills: {
        include: { skill: true },
      },
      participations: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const enrichedRecentEvents: EnrichedRecentEvent[] = recentEvents.map(
    (event: RecentEvent) => {
      const currentParticipations = event.participations.length;

      const confirmedCount = event.participations.filter(
        (participation) => participation.status === "CONFIRMED",
      ).length;

      const confirmationPercentage = calculateConfirmationRatio(
        confirmedCount,
        currentParticipations,
      );

      const eventLockEligible = confirmationPercentage >= 50;
      const lockWarning =
        confirmationPercentage >= 40 && confirmationPercentage < 50;

      return {
        ...event,
        totalParticipations: currentParticipations,
        confirmedCount,
        confirmationPercentage,
        eventLockEligible,
        lockWarning,
      };
    },
  );

  function getWidthClass(percent: number) {
    const rounded = Math.round(percent / 10) * 10;

    switch (rounded) {
      case 0:
        return "w-0";
      case 10:
        return "w-1/12";
      case 20:
        return "w-1/6";
      case 30:
        return "w-1/4";
      case 40:
        return "w-1/3";
      case 50:
        return "w-1/2";
      case 60:
        return "w-2/3";
      case 70:
        return "w-3/4";
      case 80:
        return "w-5/6";
      case 90:
      case 100:
        return "w-full";
      default:
        return "w-0";
    }
  }

  const confirmedPercent = calculateConfirmationRatio(
    confirmedParticipations,
    totalParticipations,
  );
  const pendingPercent = calculateConfirmationRatio(
    pendingParticipations,
    totalParticipations,
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-10">
        <MotionWrapper>
          <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 p-8 text-white shadow-[0_24px_70px_-30px_rgba(79,70,229,0.55)]">
            <h1 className="text-3xl font-bold">Hey {session.user.name} 👋</h1>
            <p className="mt-2 text-white/90">
              Here&apos;s what&apos;s happening across your platform today.
            </p>
          </div>
        </MotionWrapper>

        <MotionWrapper>
          <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Export Center</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Download platform participant and team data as CSV.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/api/admin/export/participants"
                className="rounded-xl bg-neutral-900 px-4 py-2.5 text-white shadow-sm transition hover:bg-black"
              >
                Export Participants CSV
              </Link>
              <Link
                href="/api/admin/export/teams"
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white shadow-sm transition hover:bg-indigo-700"
              >
                Export Teams CSV
              </Link>
            </div>
          </div>
        </MotionWrapper>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <AnimatedCard>
            <div className="surface-card interactive-card p-6">
              <p className="text-sm text-neutral-500">Total Events</p>
              <p className="mt-2 text-4xl font-bold">{totalEvents}</p>
              <p className="mt-2 text-xs text-neutral-400">+{recentEventCount} this week</p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="surface-card interactive-card p-6">
              <p className="text-sm text-neutral-500">Active Teams</p>
              <p className="mt-2 text-4xl font-bold">{totalTeams}</p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="surface-card interactive-card p-6">
              <p className="text-sm text-neutral-500">Confirmed Participations</p>
              <p className="mt-2 text-4xl font-bold text-indigo-600">
                {confirmedParticipations}
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="surface-card interactive-card p-6">
              <p className="text-sm text-neutral-500">Pending Participations</p>
              <p className="mt-2 text-4xl font-bold">{pendingParticipations}</p>
            </div>
          </AnimatedCard>
        </div>

        <AnimatedCard>
          <div className="surface-card p-6">
            <h2 className="mb-4 text-xl font-semibold">Participation Health</h2>

            <div className="space-y-4">
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Confirmed</span>
                  <span>{confirmedParticipations}</span>
                </div>

                <div className="h-2 w-full rounded-full bg-neutral-100">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 ${getWidthClass(
                      confirmedPercent,
                    )}`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span>Pending</span>
                  <span>{pendingParticipations}</span>
                </div>

                <div className="h-2 w-full rounded-full bg-neutral-100">
                  <div
                    className={`h-2 rounded-full bg-neutral-400 ${getWidthClass(
                      pendingPercent,
                    )}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard>
          <div className="surface-card p-6">
            <h2 className="mb-6 text-xl font-semibold">Platform Activity</h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-sm text-neutral-500">Total Participations</p>
                <p className="mt-2 text-3xl font-bold">{totalParticipations}</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-sm text-neutral-500">Confirmation Rate</p>
                <p className="mt-2 text-3xl font-bold">{confirmedPercent}%</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-sm text-neutral-500">Pending Rate</p>
                <p className="mt-2 text-3xl font-bold">{pendingPercent}%</p>
              </div>
            </div>
          </div>
        </AnimatedCard>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <AnimatedCard>
            <div className="surface-card p-6">
              <h2 className="mb-6 text-xl font-semibold">Participation Analytics</h2>
              <AdminAnalyticsChart
                confirmed={confirmedParticipations}
                pending={pendingParticipations}
              />
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="surface-card p-6">
              <h2 className="mb-6 text-xl font-semibold">Participation Distribution</h2>
              <EventHealthChart
                confirmed={confirmedParticipations}
                pending={pendingParticipations}
              />
            </div>
          </AnimatedCard>
        </div>

        <div className="surface-card p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Events</h2>

            <Link
              href="/admin/events/new"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white shadow-sm transition hover:bg-indigo-700"
            >
              Create Event
            </Link>
          </div>

          <div className="space-y-6">
            {recentEvents.length === 0 ? (
              <p className="text-sm text-neutral-500">No events created yet.</p>
            ) : null}

            {enrichedRecentEvents.map((event) => (
              <MotionWrapper key={event.id}>
                <div className="interactive-card rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-lg font-semibold hover:text-indigo-600"
                      >
                        {event.title}
                      </Link>

                      <p className="mt-1 text-sm text-neutral-500">
                        Team Size: {event.minTeamSize} - {event.maxTeamSize}
                      </p>

                      <p className="mt-1 text-sm text-neutral-500">
                        Confirmation Rate: {event.confirmationPercentage}%
                      </p>

                      {event.lockWarning ? (
                        <span className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
                          LOCK APPROACHING
                        </span>
                      ) : null}

                      {event.eventLockEligible ? (
                        <span className="mt-2 inline-block rounded-full bg-neutral-900 px-3 py-1 text-xs text-white">
                          GOVERNANCE READY
                        </span>
                      ) : null}

                      {event.eventSkills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {event.eventSkills.map((eventSkill) => (
                            <span
                              key={eventSkill.skill.id}
                              className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-600"
                            >
                              {eventSkill.skill.name}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className="text-sm text-neutral-400">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex gap-4">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="text-sm text-indigo-600"
                        >
                          Edit
                        </Link>

                        <DeleteEventButton eventId={event.id} />
                      </div>
                    </div>
                  </div>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
