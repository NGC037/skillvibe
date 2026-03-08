import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: { user: true },
      },
      event: true,
    },
  });

  if (!team) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p>Team not found.</p>
      </div>
    );
  }

  const isLeader = team.leaderId === session.user.id;
  const isMember = team.members.some(
    (m) => m.userId === session.user.id
  );

  if (!isMember && !isLeader) {
    redirect("/dashboard");
  }

  const memberCount = team.members.length;
  const progress =
    (memberCount / team.event.maxTeamSize) * 100;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* HERO */}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold">
          Team Management
        </h1>

        <p className="text-white/90 mt-2">
          Event: {team.event.title}
        </p>
      </div>


      {/* TEAM OVERVIEW */}

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-4">

        <div className="flex justify-between items-center">

          <div>

            <p className="text-sm text-neutral-500">
              Team ID
            </p>

            <p className="font-medium">
              {team.id.slice(0, 8)}
            </p>

          </div>

          <div>

            {team.isLocked ? (
              <span className="text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">
                LOCKED
              </span>
            ) : (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                UNLOCKED
              </span>
            )}

          </div>

        </div>

        {/* TEAM SIZE PROGRESS */}

        <div>

          <div className="flex justify-between text-sm text-neutral-600 mb-2">
            <span>Team Size</span>
            <span>
              {memberCount} / {team.event.maxTeamSize}
            </span>
          </div>

          <div className="w-full bg-neutral-100 rounded-full h-2">

            <div
  className={`bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all ${
    progress >= 90
      ? "w-full"
      : progress >= 75
      ? "w-3/4"
      : progress >= 50
      ? "w-1/2"
      : progress >= 25
      ? "w-1/4"
      : "w-1/12"
  }`}
/>

          </div>

        </div>

        {/* LOCK BUTTON */}

        {isLeader && !team.isLocked && (

          <form action={`/api/teams/lock`} method="POST">

            <input
              type="hidden"
              name="teamId"
              value={team.id}
            />

            <button
              type="submit"
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm transition"
            >
              Lock Team
            </button>

          </form>

        )}

      </div>


      {/* TEAM MEMBERS */}

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">

        <div className="flex items-center justify-between mb-6">

          <h2 className="text-lg font-semibold">
            Team Members
          </h2>

          <span className="text-sm text-neutral-500">
            {memberCount} Members
          </span>

        </div>

        <div className="space-y-4">

          {team.members.map((member) => (

            <div
              key={member.id}
              className="flex items-center justify-between border border-neutral-200 rounded-lg p-4 hover:shadow-sm transition"
            >

              <div className="flex items-center gap-3">

                {/* Avatar */}

                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                  {member.user.name?.[0] ?? "U"}
                </div>

                <div>

                  <p className="font-medium text-neutral-900">
                    {member.user.name}
                  </p>

                  <p className="text-sm text-neutral-500">
                    {member.user.email}
                  </p>

                </div>

              </div>

              {member.userId === team.leaderId && (

                <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                  Leader
                </span>

              )}

            </div>

          ))}

        </div>

      </div>


      {/* INFO CARD */}

      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-sm text-neutral-600">

        Teams must reach the required size before locking.
        Once locked, the team becomes eligible for official
        event registration.

      </div>


      {/* BACK */}

      <Link
        href="/dashboard"
        className="text-sm text-indigo-600 hover:underline"
      >
        ← Back to Dashboard
      </Link>

    </div>
  );
}