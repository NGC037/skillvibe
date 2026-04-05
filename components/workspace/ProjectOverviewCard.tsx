"use client";

import { motion } from "framer-motion";

interface ProjectOverviewCardProps {
  project: {
    id: string;
    title: string;
    shortDescription: string;
    fullDescription?: string;
    totalPhases: number;
    currentPhase: number;
    owner: { id: string; name: string | null };
    team: { id: string; name: string | null };
    architecture?: string | null;
  };
  taskStats: {
    total: number;
    completed: number;
    completionPercentage: number;
  };
}

export default function ProjectOverviewCard({
  project,
  taskStats,
}: ProjectOverviewCardProps) {
  const phaseProgress = (project.currentPhase / project.totalPhases) * 100;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all"
    >
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">{project.title}</h2>
        <p className="text-gray-300">{project.shortDescription}</p>
      </div>

      {project.fullDescription && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-200 text-sm leading-relaxed">
            {project.fullDescription}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400 text-sm mb-1">Owner</p>
          <p className="text-white font-semibold">
            {project.owner.name || "Unknown"}
          </p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400 text-sm mb-1">Total Phases</p>
          <p className="text-white font-semibold">{project.totalPhases}</p>
        </div>

        {project.architecture && (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-gray-400 text-sm mb-1">Architecture</p>
            <p className="text-white font-semibold">{project.architecture}</p>
          </div>
        )}

        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <p className="text-gray-400 text-sm mb-1">Tasks Completed</p>
          <p className="text-white font-semibold">
            {taskStats.completed}/{taskStats.total}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-300 text-sm font-semibold">
              Workspace Progress
            </p>
            <p className="text-teal-300 text-sm font-semibold">
              {taskStats.completionPercentage}%
            </p>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <motion.div
              layoutId="taskCompletionProgress"
              initial={{ width: 0 }}
              animate={{ width: `${taskStats.completionPercentage}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400"
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Based on completed tasks over total tasks in this project.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-300 text-sm font-semibold">
              Phase Progress
            </p>
            <p className="text-purple-400 text-sm font-semibold">
              {Math.round(phaseProgress)}%
            </p>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <motion.div
              layoutId="phaseProgress"
              initial={{ width: 0 }}
              animate={{ width: `${phaseProgress}%` }}
              className="h-full bg-gradient-to-r from-purple-600 to-pink-400"
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Phase {project.currentPhase} of {project.totalPhases}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
