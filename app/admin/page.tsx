import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeleteEventButton from "@/components/admin/DeleteEventButton";
import Link from "next/link";
import { calculateConfirmationRatio } from "@/lib/readiness";
import { isTeamLockEligible } from "@/lib/readiness";
import MotionWrapper from "@/components/ui/MotionWrapper";
import AnimatedCard from "@/components/ui/AnimatedCard";
import AdminAnalyticsChart from "@/components/admin/AdminAnalyticsChart";
import EventHealthChart from "@/components/admin/EventHealthChart";
import AppLayout from "@/components/layout/AppLayout";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  console.log("SESSION:", session);

  if (!session) {
    redirect("/login");
  }

  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  /* ===========================
     ANALYTICS DATA
  =========================== */

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

  /* ===========================
     RECENT EVENTS
  =========================== */

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

  const enrichedRecentEvents = recentEvents.map((event: any) => {
    const totalParticipations = event.participations.length;

    const confirmedCount = event.participations.filter(
      (p: any) => p.status === "CONFIRMED",
    ).length;

    const confirmationPercentage = calculateConfirmationRatio(
      confirmedCount,
      totalParticipations,
    );

    const eventLockEligible = confirmationPercentage >= 50;

    const lockWarning =
      confirmationPercentage >= 40 && confirmationPercentage < 50;

    return {
      ...event,
      totalParticipations,
      confirmedCount,
      confirmationPercentage,
      eventLockEligible,
      lockWarning,
    };
  });

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
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* HERO */}

        <MotionWrapper>
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold">Hey {session.user.name} 👋</h1>

            <p className="text-white/90 mt-2">
              Here’s what’s happening across your platform today.
            </p>
          </div>
        </MotionWrapper>

        {/* ANALYTICS CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AnimatedCard>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-neutral-500">Total Events</p>
              <p className="text-4xl font-bold mt-2">{totalEvents}</p>
              <p className="text-xs text-neutral-400 mt-2">
                +{recentEventCount} this week
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-neutral-500">Active Teams</p>
              <p className="text-4xl font-bold mt-2">{totalTeams}</p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-neutral-500">
                Confirmed Participations
              </p>
              <p className="text-4xl font-bold mt-2 text-indigo-600">
                {confirmedParticipations}
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-neutral-500">Pending Participations</p>
              <p className="text-4xl font-bold mt-2">{pendingParticipations}</p>
            </div>
          </AnimatedCard>
        </div>

        {/* PARTICIPATION HEALTH */}

        <AnimatedCard>
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Participation Health</h2>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Confirmed</span>
                  <span>{confirmedParticipations}</span>
                </div>

                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div
                    className={`bg-linear-to-r from-purple-600 to-indigo-600 h-2 rounded-full ${getWidthClass(
                      confirmedPercent,
                    )}`}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pending</span>
                  <span>{pendingParticipations}</span>
                </div>

                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div
                    className={`bg-neutral-400 h-2 rounded-full ${getWidthClass(
                      pendingPercent,
                    )}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* PLATFORM ANALYTICS */}

        <AnimatedCard>
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Platform Activity</h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="border border-neutral-200 rounded-xl p-4">
                <p className="text-sm text-neutral-500">Total Participations</p>
                <p className="text-3xl font-bold mt-2">{totalParticipations}</p>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4">
                <p className="text-sm text-neutral-500">Confirmation Rate</p>
                <p className="text-3xl font-bold mt-2">{confirmedPercent}%</p>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4">
                <p className="text-sm text-neutral-500">Pending Rate</p>
                <p className="text-3xl font-bold mt-2">{pendingPercent}%</p>
              </div>
            </div>
          </div>
        </AnimatedCard>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedCard>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">
                Participation Analytics
              </h2>

              <AdminAnalyticsChart
                confirmed={confirmedParticipations}
                pending={pendingParticipations}
              />
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">
                Participation Distribution
              </h2>

              <EventHealthChart
                confirmed={confirmedParticipations}
                pending={pendingParticipations}
              />
            </div>
          </AnimatedCard>
        </div>

        {/* RECENT EVENTS */}

        <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recent Events</h2>

            <Link
              href="/admin/events/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
            >
              Create Event
            </Link>
          </div>

          <div className="space-y-6">
            {recentEvents.length === 0 && (
              <p className="text-neutral-500 text-sm">No events created yet.</p>
            )}

            {enrichedRecentEvents.map((event: any) => (
              <MotionWrapper key={event.id}>
                <div className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="font-semibold text-lg hover:text-indigo-600"
                      >
                        {event.title}
                      </Link>

                      <p className="text-sm text-neutral-500 mt-1">
                        Team Size: {event.minTeamSize} - {event.maxTeamSize}
                      </p>

                      <p className="text-sm text-neutral-500 mt-1">
                        Confirmation Rate: {event.confirmationPercentage}%
                      </p>

                      {event.lockWarning && (
                        <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                          LOCK APPROACHING
                        </span>
                      )}

                      {event.eventLockEligible && (
                        <span className="inline-block mt-2 text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">
                          GOVERNANCE READY
                        </span>
                      )}

                      {event.eventSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {event.eventSkills.map((es: any) => (
                            <span
                              key={es.skill.id}
                              className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full"
                            >
                              {es.skill.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <span className="text-sm text-neutral-400">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>

                      <div className="flex gap-4">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="text-indigo-600 text-sm"
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
