"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, TrendingUp } from "lucide-react";

interface ContributionData {
  userId: string;
  userName: string | null;
  tasksCompleted: number;
  logsCreated: number;
  score: number;
}

interface ContributionPanelProps {
  projectId: string;
  refreshKey?: number;
  completionPercentage?: number;
}

export default function ContributionPanel({
  projectId,
  refreshKey = 0,
  completionPercentage = 0,
}: ContributionPanelProps) {
  const [contributions, setContributions] = useState<ContributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const res = await fetch(
          `/api/project/get-contribution?projectId=${projectId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch contributions");
        const data = await res.json();
        setContributions(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error loading contributions",
        );
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      setLoading(true);
      void fetchContributions();
    }
  }, [projectId, refreshKey]);

  const topContributor = contributions[0];
  const inactiveMembers = contributions.filter((contribution) => contribution.score < 20);

  if (loading) {
    return (
      <div className="backdrop-blur-md bg-linear-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/4 mb-6" />
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white/10 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-md bg-linear-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const maxScore = Math.max(...contributions.map((c) => c.score), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-linear-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all"
    >
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-purple-400" />
        <h3 className="text-2xl font-bold text-white">Contributions</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Top Contributor
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {topContributor?.userName || "No activity yet"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {topContributor ? `${topContributor.score} points` : "Waiting for first contribution"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Inactive Members
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {inactiveMembers.length}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Members under 20 contribution points
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Completion
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {completionPercentage}%
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Based on tasks completed in the workspace
          </p>
        </div>
      </div>

      {contributions.length === 0 ? (
        <p className="text-gray-400 text-center py-8">No contributions yet</p>
      ) : (
        <div className="space-y-4">
          {contributions.map((contrib, idx) => (
            <motion.div
              key={contrib.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group p-4 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">
                    {contrib.userName || "Unknown"}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                    <span>{contrib.tasksCompleted} tasks</span>
                    <span>{contrib.logsCreated} logs</span>
                    {contrib.score > 100 ? (
                      <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-2 py-1 text-amber-200">
                        Top Performer
                      </span>
                    ) : null}
                    {contrib.score < 20 ? (
                      <span className="rounded-full border border-slate-300/30 bg-slate-400/10 px-2 py-1 text-slate-200">
                        Low Activity
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-purple-400 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    {contrib.score}
                  </div>
                </div>
              </div>

              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  layoutId={`scoreBar-${contrib.userId}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(contrib.score / maxScore) * 100}%` }}
                  className="h-full bg-linear-to-r from-purple-600 to-pink-400"
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
