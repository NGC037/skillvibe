"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import TaskSection from "@/components/workspace/TaskSection";
import LogsSection from "@/components/workspace/LogsSection";
import WorkspaceReportDownload from "@/components/workspace/WorkspaceReportDownload";
import { JoinRequestsList } from "@/components/teams/JoinRequestsList";

interface TeamMember {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Team {
  id: string;
  name: string | null;
  code: string;
  isLocked: boolean;
  leaderId: string;
  event?: {
    title: string;
  } | null;
  leader: {
    id: string;
    name: string | null;
    email: string;
  };
  members: TeamMember[];
}

interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string | null;
  architecture?: string | null;
  totalPhases: number;
  currentPhase: number;
  tasks: Array<{
    id: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    assignedToId?: string | null;
  }>;
  currentViewer?: {
    id: string;
    canManageTasks: boolean;
    canViewAllTasks: boolean;
    canViewAllLogs: boolean;
  };
}

export default function WorkspacePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"leader" | "member">("leader");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [router, status]);

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoading(true);
        const [teamRes, projectRes] = await Promise.all([
          fetch(`/api/teams/${teamId}`),
          fetch(`/api/project/get-project-by-team?teamId=${teamId}`),
        ]);

        if (!teamRes.ok) {
          throw new Error("Failed to fetch team");
        }

        if (!projectRes.ok) {
          throw new Error("Failed to fetch project");
        }

        const [teamData, projectData] = await Promise.all([
          teamRes.json(),
          projectRes.json(),
        ]);

        setTeam(teamData);
        setProject(projectData.data === null ? null : projectData);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load workspace",
        );
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      void loadWorkspace();
    }
  }, [teamId, refreshKey]);

  const teamMembers = useMemo(() => {
    if (!team) return [];
    return [
      {
        id: team.leader.id,
        name: team.leader.name,
        email: team.leader.email,
      },
      ...team.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      })),
    ].filter(
      (member, index, list) =>
        list.findIndex((entry) => entry.id === member.id) === index,
    );
  }, [team]);

  const tasks = project?.tasks ?? [];

  const topContributor = useMemo(() => {
    if (!project || teamMembers.length === 0) {
      return null;
    }

    const rankedContributors = teamMembers.map((member) => {
      const assignedTasks = tasks.filter(
        (task) => task.assignedToId === member.id,
      ).length;
      const completedTasks = tasks.filter(
        (task) => task.assignedToId === member.id && task.status === "DONE",
      ).length;

      return {
        id: member.id,
        name: member.name || member.email,
        completedTasks,
        assignedTasks,
        score: completedTasks * 10 + assignedTasks * 2,
      };
    });

    return rankedContributors.sort((a, b) => b.score - a.score)[0] ?? null;
  }, [project, tasks, teamMembers]);

  if (status === "loading" || loading) {
    return (
      <AppLayout hideSidebar>
        <div className="flex min-h-screen items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error || !team) {
    return (
      <AppLayout hideSidebar>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-rose-500">
              {error || "Workspace unavailable"}
            </p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isLeader = session?.user?.id === team.leaderId;
  const isAdmin = session?.user?.role === "ADMIN";
  const canManageTasks = Boolean(
    project?.currentViewer?.canManageTasks || isLeader || isAdmin,
  );
  const currentUserId = project?.currentViewer?.id || session?.user?.id || "";
  const canCreateProject = (isLeader || isAdmin) && team.isLocked && !project;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const activeMembers = teamMembers.length;
  const myAssignedCount = tasks.filter(
    (task) => task.assignedToId === currentUserId,
  ).length;
  const workspaceMood = getWorkspaceMood(completionRate);
  const effectiveViewMode =
    isLeader && project ? viewMode : canManageTasks ? "leader" : "member";
  const effectiveCanManageTasks =
    canManageTasks && effectiveViewMode === "leader";
  const leaderboard = teamMembers
    .map((member) => {
      const assignedTasks = tasks.filter(
        (task) => task.assignedToId === member.id,
      ).length;
      const memberCompletedTasks = tasks.filter(
        (task) => task.assignedToId === member.id && task.status === "DONE",
      ).length;

      return {
        id: member.id,
        name: member.name || member.email,
        score: memberCompletedTasks * 10 + assignedTasks * 2,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const handleCreateProject = async (formData: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    architecture: string;
    totalPhases: number;
  }) => {
    try {
      const res = await fetch("/api/project/create-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProject(data);
      setShowCreateForm(false);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  return (
    <AppLayout hideSidebar>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_18%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                session?.user?.role === "ADMIN" ? "/admin" : "/dashboard",
              )
            }
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/18 hover:shadow-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-col gap-x-6 gap-y-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                  SkillVibe workspace
                </p>
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  {team.name || team.code}
                </h1>
                <p className="max-w-3xl text-base font-medium text-white/90">
                  {team.event?.title || "Execution workspace"}
                </p>
                <p className="text-sm text-white/80">
                  {effectiveCanManageTasks
                    ? "Leader control mode"
                    : "Member focus mode"}{" "}
                  | Team code {team.code}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                {isLeader && project ? (
                  <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-xl shadow-lg">
                    <button
                      type="button"
                      onClick={() => setViewMode("leader")}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                        effectiveViewMode === "leader"
                          ? "bg-white text-slate-900"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      Leader Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("member")}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                        effectiveViewMode === "member"
                          ? "bg-white text-slate-900"
                          : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      Member Mode
                    </button>
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-white/20 bg-white/10 px-5 py-4 backdrop-blur-xl shadow-lg">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Access
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {effectiveCanManageTasks ? "Leader" : "Member"}
                  </p>
                </div>
              </div>
            </div>

            {project ? (
              <div className="mt-8 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/70">
                        Workspace Progress
                      </p>
                      <h2 className="mt-2 text-3xl font-bold">
                        {completionRate}% completion
                      </h2>
                    </div>

                    <div
                      className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium backdrop-blur ${
                        completionRate < 30
                          ? "border-yellow-300/30 bg-yellow-500/20 text-yellow-100"
                          : completionRate < 70
                            ? "border-blue-300/30 bg-blue-500/20 text-blue-100"
                            : "border-emerald-300/30 bg-emerald-500/20 text-emerald-100"
                      }`}
                    >
                      {workspaceMood}
                    </div>
                  </div>

                  <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-300 via-blue-300 to-teal-200 shadow-[0_0_20px_rgba(255,255,255,0.35)] transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/15 text-2xl shadow-lg">
                      🥇
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">
                        Top Contributor
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-white">
                        {topContributor?.name || "No activity yet"}
                      </h2>
                      <p className="mt-2 text-sm text-white/72">
                        {topContributor
                          ? `${topContributor.completedTasks} completed tasks across ${topContributor.assignedTasks} assignments.`
                          : "Task activity will surface your strongest contributor here."}
                      </p>
                      <span className="mt-4 inline-flex rounded-full border border-white/20 bg-white/12 px-3 py-1 text-sm font-semibold text-white">
                        {topContributor?.score ?? 0} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {project ? (
              <div className="mt-6 border-t border-white/10 pt-6">
                <WorkspaceReportDownload teamId={teamId} />
              </div>
            ) : null}
          </motion.div>

          {!project ? (
            <div className="mt-8 rounded-[2rem] border border-white/20 bg-white/10 p-8 text-center text-white shadow-xl backdrop-blur-xl">
              {team.isLocked === false ? (
                <p className="text-slate-300">
                  Team is not locked yet. Lock the team before starting the
                  workspace.
                </p>
              ) : canCreateProject ? (
                <>
                  <p className="text-slate-300">
                    No workspace project exists yet. Start the execution board
                    when the team is ready.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="mt-5 rounded-2xl bg-gradient-to-r from-white to-white/90 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                  >
                    Start Workspace
                  </button>
                </>
              ) : (
                <p className="text-slate-300">
                  Waiting for the team leader to start the workspace.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                  icon="📋"
                  label="Total Tasks"
                  value={`${totalTasks}`}
                />
                <InfoCard
                  icon="✅"
                  label="Completed Tasks"
                  value={`${completedTasks}`}
                />
                <InfoCard
                  icon="👥"
                  label="Active Members"
                  value={`${activeMembers}`}
                />
                <InfoCard
                  icon="🚀"
                  label="Phase"
                  value={`${project.currentPhase}/${project.totalPhases}`}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.9rem] border border-white/20 bg-white/10 p-6 text-white shadow-xl backdrop-blur-xl">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                        Workspace Brief
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold">
                        {project.title}
                      </h2>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                        {project.fullDescription || project.shortDescription}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/12 px-4 py-3 text-sm text-cyan-50">
                      {effectiveCanManageTasks
                        ? "You can create, assign, reassign, and delete tasks for this workspace."
                        : "You can only view your assigned tasks and update their status."}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.9rem] border border-white/20 bg-white/10 p-6 text-white shadow-xl backdrop-blur-xl">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                      Contributor Board
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      Mini Leaderboard
                    </h2>
                    <p className="mt-2 text-sm text-slate-200">
                      Quick team momentum snapshot based on completed and
                      assigned work.
                    </p>
                  </div>

                  <div className="mt-5 space-y-3">
                    {leaderboard.map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 transition-all duration-300 hover:scale-[1.01] hover:bg-white/14"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                          <span className="text-sm font-medium text-white">
                            {member.name}
                          </span>
                        </div>
                        <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white">
                          {member.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <TaskSection
                projectId={project.id}
                currentUserId={currentUserId}
                canManageTasks={effectiveCanManageTasks}
                teamMembers={teamMembers}
                viewMode={effectiveViewMode}
                onTaskUpdated={() => setRefreshKey((current) => current + 1)}
              />

              {isLeader && (
                <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
                  <JoinRequestsList
                    teamId={teamId}
                    isLeader={isLeader}
                    onRequestProcessed={() =>
                      setRefreshKey((current) => current + 1)
                    }
                  />
                </div>
              )}

              <LogsSection
                projectId={project.id}
                canManageTasks={effectiveCanManageTasks}
                viewMode={effectiveViewMode}
                onLogCreated={() => setRefreshKey((current) => current + 1)}
              />
            </div>
          )}
        </div>

        {showCreateForm ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/95 p-8 text-white"
              onClick={(event) => event.stopPropagation()}
            >
              <h2 className="text-2xl font-bold">Start Workspace</h2>
              <p className="mt-2 text-sm text-slate-300">
                Set up the project board, then assign work to your team.
              </p>
              <CreateProjectForm
                onSubmit={handleCreateProject}
                onCancel={() => setShowCreateForm(false)}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </AppLayout>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-white/20 bg-white/10 p-6 text-white shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/12 text-xl shadow-sm">
          {icon}
        </span>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-200">
          {label}
        </p>
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function getWorkspaceMood(completionRate: number) {
  if (completionRate < 30) {
    return "⚠️ Getting Started";
  }

  if (completionRate < 70) {
    return "🚀 In Progress";
  }

  return "🔥 Almost There";
}

interface CreateProjectFormProps {
  onSubmit: (data: {
    title: string;
    shortDescription: string;
    fullDescription: string;
    architecture: string;
    totalPhases: number;
  }) => Promise<void>;
  onCancel: () => void;
}

function CreateProjectForm({ onSubmit, onCancel }: CreateProjectFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    architecture: "",
    totalPhases: 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input
        type="text"
        required
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
        placeholder="Project title"
        aria-label="Project title"
      />
      <input
        type="text"
        required
        value={formData.shortDescription}
        onChange={(e) =>
          setFormData({ ...formData, shortDescription: e.target.value })
        }
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
        placeholder="Short description"
        aria-label="Short description"
      />
      <textarea
        value={formData.fullDescription}
        onChange={(e) =>
          setFormData({ ...formData, fullDescription: e.target.value })
        }
        className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
        placeholder="Full description"
        aria-label="Full description"
      />
      <input
        type="text"
        value={formData.architecture}
        onChange={(e) =>
          setFormData({ ...formData, architecture: e.target.value })
        }
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
        placeholder="Architecture"
        aria-label="Architecture"
      />
      <input
        type="number"
        min={1}
        value={formData.totalPhases}
        onChange={(e) =>
          setFormData({
            ...formData,
            totalPhases: Number.parseInt(e.target.value, 10) || 1,
          })
        }
        className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
        placeholder="Total phases"
        aria-label="Total phases"
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-2xl bg-gradient-to-r from-white to-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Workspace"}
        </button>
      </div>
    </form>
  );
}
