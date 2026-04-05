"use client";

import { motion } from "framer-motion";

type WorkspaceMember = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type WorkspaceTask = {
  id: string;
  status: string;
  assignedToId: string | null;
};

type WorkspaceLog = {
  id: string;
  userId: string;
  createdAt: string;
};

type WorkspaceTeam = {
  id: string;
  name: string | null;
  code: string;
  leaderId: string;
  leader: {
    id: string;
    name: string | null;
    email: string;
  };
  members: WorkspaceMember[];
  project: {
    id: string;
    title: string;
    tasks: WorkspaceTask[];
    progressLogs: WorkspaceLog[];
  } | null;
};

interface AdminWorkspacesDashboardProps {
  teams: WorkspaceTeam[];
}

type RankedWorkspace = {
  id: string;
  teamName: string;
  projectTitle: string | null;
  completionPercentage: number;
  completedTasks: number;
  totalTasks: number;
  logsCount: number;
  topContributor: string;
  topContributorScore: number;
  averageContributionScore: number;
  score: number;
  status: "Healthy" | "Moderate" | "At Risk";
};

export default function AdminWorkspacesDashboard({
  teams,
}: AdminWorkspacesDashboardProps) {
  const rankedTeams: RankedWorkspace[] = teams
    .map((team) => {
      const tasks = team.project?.tasks ?? [];
      const logs = team.project?.progressLogs ?? [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task) => task.status === "DONE").length;
      const completionPercentage =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      const contributors = [
        {
          id: team.leader.id,
          name: team.leader.name ?? team.leader.email,
        },
        ...team.members.map((member) => ({
          id: member.user.id,
          name: member.user.name ?? member.user.email,
        })),
      ]
        .filter(
          (contributor, index, contributorsList) =>
            contributorsList.findIndex((entry) => entry.id === contributor.id) === index,
        )
        .map((contributor) => {
          const tasksCompleted = tasks.filter(
            (task) => task.status === "DONE" && task.assignedToId === contributor.id,
          ).length;
          const logsCreated = logs.filter((log) => log.userId === contributor.id).length;
          const effectiveLogs = Math.min(logsCreated, tasksCompleted + 2);
          const score = tasksCompleted * 10 + effectiveLogs * 3;

          return {
            ...contributor,
            score,
          };
        });

      const topContributor =
        contributors.reduce(
          (top, contributor) => (contributor.score > top.score ? contributor : top),
          contributors[0] ?? { id: "", name: "No contributor yet", score: 0 },
        ) ?? { id: "", name: "No contributor yet", score: 0 };

      const averageContributionScore =
        contributors.length === 0
          ? 0
          : Math.round(
              contributors.reduce((sum, contributor) => sum + contributor.score, 0) /
                contributors.length,
            );

      const logsWeight = Math.max(1, logs.length);
      const score = completionPercentage + averageContributionScore + logsWeight;
      const status: RankedWorkspace["status"] =
        completionPercentage > 70
          ? "Healthy"
          : completionPercentage > 40
            ? "Moderate"
            : "At Risk";

      return {
        id: team.id,
        teamName: team.name ?? team.code,
        projectTitle: team.project?.title ?? null,
        completionPercentage,
        completedTasks,
        totalTasks,
        logsCount: logs.length,
        topContributor: topContributor.name,
        topContributorScore: topContributor.score,
        averageContributionScore,
        score,
        status,
      };
    })
    .sort((a, b) => b.score - a.score);

  const totalTeams = rankedTeams.length;
  const teamsAtRisk = rankedTeams.filter((team) => team.status === "At Risk").length;
  const bestPerformingTeam = rankedTeams[0]?.teamName ?? "No teams yet";
  const averageCompletion =
    rankedTeams.length === 0
      ? 0
      : Math.round(
          rankedTeams.reduce((sum, team) => sum + team.completionPercentage, 0) /
            rankedTeams.length,
        );

  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 p-8 text-white shadow-[0_24px_70px_-30px_rgba(79,70,229,0.55)]"
      >
        <h1 className="text-3xl font-bold">Workspace Command Center</h1>
        <p className="mt-2 max-w-3xl text-white/85">
          Compare delivery momentum, contribution quality, and workspace health across every team.
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-4">
        <InsightCard label="Total Teams" value={`${totalTeams}`} />
        <InsightCard label="Teams At Risk" value={`${teamsAtRisk}`} />
        <InsightCard label="Best Team" value={bestPerformingTeam} />
        <InsightCard label="Avg Completion" value={`${averageCompletion}%`} />
      </div>

      {rankedTeams.length === 0 ? (
        <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-semibold text-white">No workspaces yet</h2>
          <p className="mt-2 text-sm text-gray-300">
            Team workspace analytics will appear here once projects, tasks, and logs start flowing.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {rankedTeams.map((team, index) => {
            const rankBadge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
            const statusStyles =
              team.status === "Healthy"
                ? "bg-emerald-400/15 text-emerald-200 border-emerald-300/30"
                : team.status === "Moderate"
                  ? "bg-amber-400/15 text-amber-200 border-amber-300/30"
                  : "bg-rose-400/15 text-rose-200 border-rose-300/30";

            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`backdrop-blur-md border rounded-2xl p-6 transition-all ${
                  index === 0
                    ? "bg-gradient-to-br from-white/15 to-white/5 border-teal-300/35 shadow-[0_20px_50px_-30px_rgba(45,212,191,0.45)]"
                    : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 hover:shadow-xl hover:shadow-purple-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{rankBadge}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{team.teamName}</h2>
                      <p className="mt-1 text-sm text-gray-300">
                        {team.projectTitle ?? "No workspace project yet"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles}`}
                  >
                    {team.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <MetricBlock
                    label="Completion"
                    value={`${team.completionPercentage}%`}
                  />
                  <MetricBlock
                    label="Tasks Completed"
                    value={`${team.completedTasks}/${team.totalTasks}`}
                  />
                  <MetricBlock label="Logs Count" value={`${team.logsCount}`} />
                  <MetricBlock
                    label="Top Contributor"
                    value={team.topContributor}
                    subValue={`${team.topContributorScore} pts`}
                  />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
                    <span>Ranking score</span>
                    <span>{team.score.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-400 to-teal-400"
                      style={{
                        width: `${Math.min(
                          100,
                          rankedTeams[0]?.score
                            ? (team.score / rankedTeams[0].score) * 100
                            : 0,
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-400">
                    Avg contribution: {team.averageContributionScore} | logs weight: {Math.max(1, team.logsCount)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:shadow-purple-500/10 transition-all">
      <p className="text-sm text-gray-300">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      {subValue ? <p className="mt-1 text-xs text-gray-400">{subValue}</p> : null}
    </div>
  );
}
