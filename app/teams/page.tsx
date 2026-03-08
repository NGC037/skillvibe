import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function TeamsPage() {

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    redirect("/api/auth/signin");
  }

  const userId = (session.user as any).id;

  const teams = await prisma.team.findMany({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      event: true,
      members: true,
    },
  });

  return (

    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

      {/* HEADER */}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">

        <h1 className="text-3xl font-bold">
          Your Teams
        </h1>

        <p className="text-white/90 mt-2">
          Manage your teams and collaborate with teammates.
        </p>

      </div>


      {/* TEAM LIST */}

      {teams.length === 0 ? (

        <div className="bg-white border border-neutral-200 rounded-xl p-8">

          <p className="text-neutral-600">
            You are not part of any team yet.
          </p>

        </div>

      ) : (

        <div className="grid md:grid-cols-2 gap-6">

          {teams.map((team) => (

            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition"
            >

              <h2 className="text-lg font-semibold">
                {team.event.title}
              </h2>

              <p className="text-sm text-neutral-500 mt-1">
                Team ID: {team.id.slice(0,8)}
              </p>

              <p className="text-sm text-neutral-500 mt-2">
                Members: {team.members.length}
              </p>

              {team.isLocked ? (
                <span className="inline-block mt-3 text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">
                  LOCKED
                </span>
              ) : (
                <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  ACTIVE
                </span>
              )}

            </Link>

          ))}

        </div>

      )}

    </div>

  );

}