"use client";

interface WorkspaceTask {
  id: string;
  status: string;
}

interface WorkspaceLog {
  id: string;
}

interface WorkspaceContribution {
  userId: string;
  userName: string | null;
  score: number;
}

interface ProjectSummaryProps {
  tasks: WorkspaceTask[];
  logs: WorkspaceLog[];
  contributions: WorkspaceContribution[];
  loading?: boolean;
}

export default function ProjectSummary({
  tasks,
  logs,
  contributions,
  loading = false,
}: ProjectSummaryProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const totalLogs = logs.length;
  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const topContributor = contributions.reduce<WorkspaceContribution | null>(
    (currentTop, contribution) => {
      if (!currentTop || contribution.score > currentTop.score) {
        return contribution;
      }

      return currentTop;
    },
    null,
  );

  if (loading) {
    return (
      <div className="animate-pulse backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 space-y-4">
        <div className="h-6 w-40 rounded-full bg-white/10" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-white/10" />
          ))}
        </div>
        <div className="h-20 rounded-2xl bg-white/10" />
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white">Project Summary</h3>
        <p className="mt-1 text-sm text-gray-400">
          Snapshot of delivery progress and team activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Total Tasks" value={`${totalTasks}`} />
        <SummaryMetric label="Completed Tasks" value={`${completedTasks}`} />
        <SummaryMetric label="Total Logs" value={`${totalLogs}`} />
        <SummaryMetric label="Completion" value={`${completionPercentage}%`} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">Top Contributor</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {topContributor?.userName || "No contribution yet"}
            </p>
          </div>

          {topContributor ? (
            <span className="inline-flex items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-sm font-medium text-amber-200">
              Top Contributor
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-sm text-gray-400">
          {topContributor
            ? `${topContributor.score} points so far.`
            : totalTasks === 0 && totalLogs === 0
              ? "No tasks or logs available yet."
              : "Activity data will appear once contributions are recorded."}
        </p>
      </div>

      {totalTasks === 0 || totalLogs === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-4 text-sm text-gray-400">
          {totalTasks === 0 && totalLogs === 0
            ? "No tasks or logs yet. Start adding work items and updates to build the report."
            : totalTasks === 0
              ? "No tasks yet. Add tasks to unlock progress tracking."
              : "No logs yet. Add updates so the workspace tells a clearer story."}
        </div>
      ) : null}
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
