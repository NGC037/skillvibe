"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";

interface WorkspaceTask {
  id: string;
  title: string;
  status: string;
  description?: string;
  assignedTo?: { name: string | null } | null;
  createdAt: string;
}

interface WorkspaceLog {
  id: string;
  content: string;
  createdAt: string;
  user?: { name: string | null } | null;
}

interface WorkspaceContribution {
  userId: string;
  userName: string | null;
  tasksCompleted: number;
  logsCreated: number;
  score: number;
}

interface WorkspaceEvaluationPanelProps {
  projectTitle: string;
  teamName: string;
  tasks: WorkspaceTask[];
  logs: WorkspaceLog[];
  contributions: WorkspaceContribution[];
  loading: boolean;
}

export default function WorkspaceEvaluationPanel({
  projectTitle,
  teamName,
  tasks,
  logs,
  contributions,
  loading,
}: WorkspaceEvaluationPanelProps) {
  const summary = useMemo(() => {
    const topContributor = contributions[0] ?? null;
    const totalLogs = logs.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "DONE").length;

    return {
      topContributor,
      totalLogs,
      totalTasks,
      completedTasks,
    };
  }, [contributions, logs.length, tasks]);

  const handleExport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      teamName,
      projectTitle,
      workspaceHealth: {
        progressPercentage:
          summary.totalTasks === 0
            ? 0
            : Math.round((summary.completedTasks / summary.totalTasks) * 100),
        activeMembers: contributions.filter((contribution) => contribution.score > 0).length,
        logsCount: summary.totalLogs,
      },
      summary: {
        tasksCompleted: summary.completedTasks,
        totalTasks: summary.totalTasks,
        totalLogs: summary.totalLogs,
        topContributor: summary.topContributor,
        contributionBreakdown: contributions,
      },
      tasks,
      logs,
      contributions,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${teamName.replace(/\s+/g, "-").toLowerCase()}-workspace-report.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="animate-pulse backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
        <div className="h-6 w-48 rounded-full bg-white/10" />
        <div className="h-24 rounded-2xl bg-white/10" />
        <div className="h-24 rounded-2xl bg-white/10" />
        <div className="h-24 rounded-2xl bg-white/10" />
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Project Summary</h3>
          <p className="mt-1 text-sm text-gray-400">
            Presentable evaluation snapshot for external review.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-teal-400 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <SummaryRow
          label="Tasks Completed"
          value={`${summary.completedTasks}/${summary.totalTasks}`}
        />
        <SummaryRow label="Total Logs" value={`${summary.totalLogs}`} />
        <SummaryRow
          label="Top Contributor"
          value={summary.topContributor?.userName || "No activity yet"}
        />
        <SummaryRow label="Team" value={teamName} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-white mb-3">
          Contribution Breakdown
        </p>

        {contributions.length === 0 ? (
          <p className="text-sm text-gray-400">
            Contribution data will appear once the team starts working.
          </p>
        ) : (
          <div className="space-y-3">
            {contributions.map((contribution) => (
              <div
                key={contribution.userId}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {contribution.userName || "Unknown"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {contribution.tasksCompleted} tasks completed, {contribution.logsCreated} logs
                  </p>
                </div>
                <p className="text-sm font-semibold text-purple-300">
                  {contribution.score} pts
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
