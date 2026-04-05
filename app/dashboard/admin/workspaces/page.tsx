import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppLayout from "@/components/layout/AppLayout";
import AdminWorkspacesDashboard from "@/components/admin/AdminWorkspacesDashboard";

export default async function AdminWorkspacesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const teams = await prisma.team.findMany({
    include: {
      leader: true,
      members: {
        include: {
          user: true,
        },
      },
      project: {
        include: {
          tasks: true,
          progressLogs: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const serializedTeams = teams.map((team) => ({
    ...team,
    createdAt: team.createdAt.toISOString(),
    project: team.project
      ? {
          ...team.project,
          createdAt: team.project.createdAt.toISOString(),
          tasks: team.project.tasks.map((task) => ({
            ...task,
            createdAt: task.createdAt.toISOString(),
            completedAt: task.completedAt?.toISOString() ?? null,
          })),
          progressLogs: team.project.progressLogs.map((log) => ({
            ...log,
            createdAt: log.createdAt.toISOString(),
          })),
        }
      : null,
  }));

  return (
    <AppLayout>
      <AdminWorkspacesDashboard teams={serializedTeams} />
    </AppLayout>
  );
}
