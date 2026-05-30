import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TeamsWorkspaceGrid from "@/components/teams/TeamsWorkspaceGrid";
import AppLayout from "@/components/layout/AppLayout";

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

    <AppLayout>
    <div className="mx-auto max-w-6xl space-y-8">

      {/* HEADER */}

      <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 p-8 text-white shadow-[0_24px_70px_-30px_rgba(79,70,229,0.55)]">

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
    </AppLayout>

  );

}
