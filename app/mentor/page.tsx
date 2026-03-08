import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { calculateTeamReadiness, getTeamStatus } from "@/lib/readiness";
import { isTeamLockEligible } from "@/lib/readiness";
import AppLayout from "@/components/layout/AppLayout";

import AnimatedCard from "@/components/ui/AnimatedCard";
import MotionWrapper from "@/components/ui/MotionWrapper";

export default async function MentorPage() {

  const session = await getServerSession(authOptions);

  if (!session) redirect("/dashboard");

  if (!session || (session.user as any).role !== "MENTOR") {
    redirect("/dashboard");
  }

  if (session.user.role !== Role.MENTOR) {
    redirect("/dashboard");
  }

  /* ===========================
     ANALYTICS
  =========================== */

  const totalEvents = await prisma.event.count();

  const totalTeams = await prisma.team.count();

  const totalStudents = await prisma.user.count({
    where: { role: "STUDENT" },
  });

  const events = await prisma.event.findMany({
    include: {
      teams: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enrichedEvents = events.map((event) => {

    const totalParticipations = event.teams
      .flatMap((team) => team.members).length;

    const eventConfirmationPercentage = 100;

    return {
      
      ...event,

      teams: event.teams.map((team) => {

        const memberCount = team.members.length;

        const readinessPercentage = calculateTeamReadiness(
          memberCount,
          event.minTeamSize
        );

        const computedStatus = getTeamStatus(
          memberCount,
          event.minTeamSize,
          event.maxTeamSize
        );

        const lockEligible = isTeamLockEligible(
          memberCount,
          event.minTeamSize,
          eventConfirmationPercentage
        );

        return {
          ...team,
          memberCount,
          readinessPercentage,
          computedStatus,
          lockEligible,
        };

      }),

    };

  });

  return (
    <AppLayout>


    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

      {/* HERO */}

      <MotionWrapper>
  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">

        <h1 className="text-3xl font-bold">
          Hey, {session.user.name} 👋
        </h1>

        <p className="text-white/90 mt-2">
          Here's what's happening across your teams today.
        </p>

      </div>
</MotionWrapper>


      {/* ANALYTICS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <AnimatedCard>
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">

            <p className="text-sm text-neutral-500">
              Total Events
            </p>

            <p className="text-4xl font-bold mt-2 text-neutral-900">
              {totalEvents}
            </p>

          </div>
        </AnimatedCard>


        <AnimatedCard>
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">

            <p className="text-sm text-neutral-500">
              Active Teams
            </p>

            <p className="text-4xl font-bold mt-2 text-neutral-900">
              {totalTeams}
            </p>

          </div>
        </AnimatedCard>


        <AnimatedCard>
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">

            <p className="text-sm text-neutral-500">
              Registered Students
            </p>

            <p className="text-4xl font-bold mt-2 text-neutral-900">
              {totalStudents}
            </p>

          </div>
        </AnimatedCard>

      </div>

      


      {/* EVENTS */}

      <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">

        <h2 className="text-2xl font-semibold mb-8">
          Event Teams Overview
        </h2>

        <div className="space-y-8">

          {enrichedEvents.length === 0 && (
            <p className="text-neutral-500 text-sm">
              No events available.
            </p>
          )}


          {enrichedEvents.map((event) => (

            <MotionWrapper>
  <div
    className="border border-neutral-200 rounded-xl p-6 hover:shadow-md transition"
  >

              <h3 className="text-lg font-semibold mb-6">
                {event.title}
              </h3>


              {event.teams.length === 0 ? (

                <p className="text-neutral-500 text-sm">
                  No teams formed yet.
                </p>

              ) : (

                <div className="space-y-5">

                  {event.teams.map((team) => {

                    let badgeColor = "bg-yellow-100 text-yellow-700";

                    if (team.computedStatus === "READY") {
                      badgeColor = "bg-green-100 text-green-700";
                    }

                    if (team.computedStatus === "FULL") {
                      badgeColor = "bg-blue-100 text-blue-700";
                    }

                    return (

                      <MotionWrapper>
  <div
 className="border border-neutral-200 rounded-xl p-5 bg-neutral-50 hover:-translate-y-1 hover:shadow-md transition"
  >

                        <div className="flex justify-between items-center mb-4">

                          <div className="flex items-center gap-3">

                            <span className="font-medium">
                              Team {team.id.slice(0, 8)}
                            </span>

                            <span
                              className={`text-xs px-3 py-1 rounded-full font-medium ${badgeColor}`}
                            >
                              {team.computedStatus}
                            </span>

                            {team.lockEligible && (
                              <span className="text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">
                                LOCK ELIGIBLE
                              </span>
                            )}

                          </div>

                          <span className="text-sm text-neutral-500">
                            {team.memberCount}/{event.maxTeamSize} members
                          </span>

                        </div>


                        {/* READINESS BAR */}

                        <div className="mb-4">

                          <div className="flex justify-between text-xs text-neutral-500 mb-1">
                            <span>Team Readiness</span>
                            <span>{team.readinessPercentage}%</span>
                          </div>

                          <div className="w-full bg-neutral-200 rounded-full h-2">

                            <div
                              className={`bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full ${
                                team.readinessPercentage >= 75
                                  ? "w-3/4"
                                  : team.readinessPercentage >= 50
                                  ? "w-1/2"
                                  : team.readinessPercentage >= 25
                                  ? "w-1/4"
                                  : "w-[10%]"
                              }`}
                            />

                          </div>

                        </div>

                        <div className="flex items-center gap-2 text-xs mt-2">

  <span className="text-neutral-500">
    Health
  </span>

  {team.readinessPercentage >= 75 && (
    <span className="text-green-600 font-medium">
      Excellent
    </span>
  )}

  {team.readinessPercentage >= 50 && team.readinessPercentage < 75 && (
    <span className="text-yellow-600 font-medium">
      Moderate
    </span>
  )}

  {team.readinessPercentage < 50 && (
    <span className="text-red-600 font-medium">
      Needs Attention
    </span>
  )}

</div>


                        {/* MEMBERS */}

                        <div className="space-y-2">

                          {team.members.map((member) => (

                            <div
                              key={member.id}
                              className="flex justify-between text-sm"
                            >

                              <span className="text-neutral-800">
                                {member.user.name}
                              </span>

                              <span className="text-neutral-500">
                                {member.user.email}
                              </span>

                            </div>

                          ))}

                        </div>

                        </div>
</MotionWrapper>

                    );

                  })}

                </div>

              )}

              </div>
</MotionWrapper>

          ))}

        </div>

      </div>

    </div>
</AppLayout>

  );

}