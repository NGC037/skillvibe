import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeamsWorkspaceGrid from "@/components/teams/TeamsWorkspaceGrid";

export default async function TeamsPage() {

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!session || !session.user || !userId) {
    redirect("/api/auth/signin");
  }

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

      <TeamsWorkspaceGrid teams={teams} />

    </div>

  );

}
