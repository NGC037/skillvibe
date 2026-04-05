"use client";

import { useState } from "react";
import { Activity, ShieldCheck, TriangleAlert } from "lucide-react";

interface WorkspaceLog {
  id: string;
  createdAt: string;
}

interface WorkspaceContribution {
  userId: string;
  score: number;
}

interface WorkspaceHealthCardProps {
  progressPercentage: number;
  totalMembers: number;
  contributions: WorkspaceContribution[];
  logs: WorkspaceLog[];
  loading?: boolean;
}

export default function WorkspaceHealthCard({
  progressPercentage,
  totalMembers,
  contributions,
  logs,
  loading = false,
}: WorkspaceHealthCardProps) {
  const [referenceTime] = useState(() => Date.now());
  const activeMembers = contributions.filter((contribution) => contribution.score > 0).length;
  const sevenDaysAgo = referenceTime - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter((log) => {
    const createdAt = new Date(log.createdAt).getTime();
    return !Number.isNaN(createdAt) && createdAt >= sevenDaysAgo;
  }).length;

  const status =
    progressPercentage > 70
      ? "Healthy"
      : progressPercentage > 40
        ? "Moderate"
        : "At Risk";

  const StatusIcon =
    status === "Healthy"
      ? ShieldCheck
      : status === "Moderate"
        ? Activity
        : TriangleAlert;

  const statusClassName =
    status === "Healthy"
      ? "bg-emerald-400/15 text-emerald-200 border border-emerald-300/30"
      : status === "Moderate"
        ? "bg-amber-400/15 text-amber-200 border border-amber-300/30"
        : "bg-rose-400/15 text-rose-200 border border-rose-300/30";

  if (loading) {
    return (
      <div className="animate-pulse backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 space-y-5">
        <div className="h-6 w-40 rounded-full bg-white/10" />
        <div className="h-10 w-28 rounded-full bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Workspace Health</h3>
          <p className="mt-1 text-sm text-gray-400">
            Quick read on delivery momentum and recent team activity.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${statusClassName}`}
        >
          <StatusIcon className="w-4 h-4" />
          {status}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard label="Progress" value={`${progressPercentage}%`} />
        <MetricCard label="Active Members" value={`${activeMembers}/${totalMembers}`} />
        <MetricCard label="Logs in 7 Days" value={`${recentLogs}`} />
        <MetricCard label="Status" value={status} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
