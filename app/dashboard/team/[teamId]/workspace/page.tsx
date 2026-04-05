"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import ProjectOverviewCard from "@/components/workspace/ProjectOverviewCard";
import WorkspaceHealthCard from "@/components/workspace/WorkspaceHealthCard";
import ProjectSummary from "@/components/workspace/ProjectSummary";
import ContributionPanel from "@/components/workspace/ContributionPanel";
import TaskSection from "@/components/workspace/TaskSection";
import LogsSection from "@/components/workspace/LogsSection";
import { Loader } from "lucide-react";

interface Project {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  totalPhases: number;
  currentPhase: number;
  owner: { id: string; name: string | null };
  team: { id: string; name: string | null };
  tasks: Array<{ id: string; status: string }>;
}

interface TaskStats {
  total: number;
  completed: number;
  completionPercentage: number;
}

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

interface Team {
  id: string;
  name: string;
  isLocked: boolean;
  leaderId: string;
  members: Array<{ userId: string }>;
}

export default function WorkspacePage() {
  // ============================================
  // 1. HOOKS - All hooks must be at the top
  // ============================================
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [workspaceRefreshKey, setWorkspaceRefreshKey] = useState(0);
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    completionPercentage: 0,
  });
  const [workspaceTasks, setWorkspaceTasks] = useState<WorkspaceTask[]>([]);
  const [workspaceLogs, setWorkspaceLogs] = useState<WorkspaceLog[]>([]);
  const [workspaceContributions, setWorkspaceContributions] = useState<
    WorkspaceContribution[]
  >([]);
  const [workspaceSummaryLoading, setWorkspaceSummaryLoading] = useState(false);

  // ============================================
  // 2. EFFECTS - All useEffect calls second
  // ============================================
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setTeamLoaded(false);
        const res = await fetch(`/api/teams/${teamId}`);
        if (!res.ok) throw new Error("Failed to fetch team");
        const data = await res.json();
        console.log("TEAM FROM API:", data);
        setTeam(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch team");
      } finally {
        setTeamLoaded(true);
      }
    };

    const fetchProject = async () => {
      try {
        const res = await fetch(
          `/api/project/get-project-by-team?teamId=${teamId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        if (data.data === null) {
          setProject(null);
        } else {
          setProject(data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch project",
        );
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeam();
      fetchProject();
    }
  }, [teamId]);

  useEffect(() => {
    const fetchWorkspaceSummary = async () => {
      if (!project?.id) {
        setTaskStats({ total: 0, completed: 0, completionPercentage: 0 });
        setWorkspaceTasks([]);
        setWorkspaceLogs([]);
        setWorkspaceContributions([]);
        return;
      }

      try {
        setWorkspaceSummaryLoading(true);
        const [tasksRes, logsRes, contributionsRes] = await Promise.all([
          fetch(`/api/project/get-tasks?projectId=${project.id}`),
          fetch(`/api/project/get-logs?projectId=${project.id}`),
          fetch(`/api/project/get-contribution?projectId=${project.id}`),
        ]);

        if (!tasksRes.ok || !logsRes.ok || !contributionsRes.ok) {
          throw new Error("Failed to fetch workspace summary");
        }

        const [tasks, logs, contributions] = (await Promise.all([
          tasksRes.json(),
          logsRes.json(),
          contributionsRes.json(),
        ])) as [
          WorkspaceTask[],
          WorkspaceLog[],
          WorkspaceContribution[],
        ];

        const total = tasks.length;
        const completed = tasks.filter((task) => task.status === "DONE").length;
        const completionPercentage =
          total === 0 ? 0 : Math.round((completed / total) * 100);

        setTaskStats({ total, completed, completionPercentage });
        setWorkspaceTasks(tasks);
        setWorkspaceLogs(logs);
        setWorkspaceContributions(contributions);
      } catch (taskError) {
        console.error("WORKSPACE SUMMARY ERROR:", taskError);
      } finally {
        setWorkspaceSummaryLoading(false);
      }
    };

    void fetchWorkspaceSummary();
  }, [project?.id, workspaceRefreshKey]);

  // ============================================
  // 3. GUARD CLAUSES - Conditional returns
  // ============================================
  if (status === "loading") {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (status === "unauthenticated") {
    return null; // Render nothing while redirecting
  }

  // ============================================
  // 4. JSX RETURN - Main component JSX
  // ============================================

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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create project");
      }

      const newProject = await res.json();
      setProject(newProject);
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!teamLoaded || !team) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="animate-pulse backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="h-10 w-56 rounded-full bg-white/10" />
            <div className="mt-4 h-4 w-80 rounded-full bg-white/10" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="animate-pulse backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
              <div className="h-6 w-40 rounded-full bg-white/10" />
              <div className="h-20 rounded-2xl bg-white/10" />
              <div className="h-3 w-full rounded-full bg-white/10" />
            </div>
            <div className="animate-pulse backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
              <div className="h-6 w-32 rounded-full bg-white/10" />
              <div className="h-16 rounded-2xl bg-white/10" />
              <div className="h-16 rounded-2xl bg-white/10" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isTeamLeader = session?.user?.id === team?.leaderId;
  const isAdmin = session?.user?.role === "ADMIN";
  const canCreateProject = (isTeamLeader || isAdmin) && team.isLocked && !project;
  const canViewWorkspacePanels = Boolean(project);

  const handleWorkspaceDataChange = () => {
    setWorkspaceRefreshKey((current) => current + 1);
  };

  const handleExportReport = () => {
    const data = {
      team: team.name,
      members: team.members,
      tasks: workspaceTasks,
      logs: workspaceLogs,
      contribution: workspaceContributions,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workspace-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-black">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {team?.name} Workspace
              </h1>
              <p className="text-gray-300">Team collaboration workspace</p>
            </div>

            <button
              onClick={handleExportReport}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-teal-400 px-4 py-2 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all"
            >
              Export Report
            </button>
          </motion.div>

          {/* No Project State */}
          {!project && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {team.isLocked === false ? (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-gray-300">
                    Team is not locked yet. Lock the team to create a workspace.
                  </p>
                </div>
              ) : canCreateProject ? (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-gray-300 mb-4">
                    No workspace project yet. Create one to get started!
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
                  >
                    Start Workspace
                  </button>
                </div>
              ) : (
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-gray-300">
                    Workspace is ready to start once a team leader or admin creates the project.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Project Content */}
          {canViewWorkspacePanels && project && (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ProjectOverviewCard project={project} taskStats={taskStats} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 }}
                >
                  <WorkspaceHealthCard
                    progressPercentage={taskStats.completionPercentage}
                    totalMembers={team.members.length + 1}
                    contributions={workspaceContributions}
                    logs={workspaceLogs}
                    loading={workspaceSummaryLoading}
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <ProjectSummary
                  tasks={workspaceTasks}
                  logs={workspaceLogs}
                  contributions={workspaceContributions}
                  loading={workspaceSummaryLoading}
                />
              </motion.div>

              {/* Contribution Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ContributionPanel
                  projectId={project.id}
                  refreshKey={workspaceRefreshKey}
                  completionPercentage={taskStats.completionPercentage}
                />
              </motion.div>

              {/* Task Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TaskSection
                  projectId={project.id}
                  onTaskUpdated={handleWorkspaceDataChange}
                  isTeamMember={
                    team?.members.some((m) => m.userId === session?.user?.id) ||
                    team?.leaderId === session?.user?.id ||
                    isAdmin
                  }
                />
              </motion.div>

              {/* Logs Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <LogsSection
                  projectId={project.id}
                  onLogCreated={handleWorkspaceDataChange}
                  isTeamMember={
                    team?.members.some((m) => m.userId === session?.user?.id) ||
                    team?.leaderId === session?.user?.id ||
                    isAdmin
                  }
                />
              </motion.div>
            </div>
          )}

          {/* Create Project Modal */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowCreateForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="backdrop-blur-md bg-slate-800/90 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-4">
                  Start Workspace
                </h2>
                <CreateProjectForm
                  onSubmit={handleCreateProject}
                  onCancel={() => setShowCreateForm(false)}
                />
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-300 block mb-2">
          Project Title
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          placeholder="Enter project title"
        />
      </div>

      <div>
        <label className="text-sm text-gray-300 block mb-2">
          Short Description
        </label>
        <input
          type="text"
          required
          value={formData.shortDescription}
          onChange={(e) =>
            setFormData({ ...formData, shortDescription: e.target.value })
          }
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          placeholder="Brief description"
        />
      </div>

      <div>
        <label className="text-sm text-gray-300 block mb-2">
          Full Description
        </label>
        <textarea
          value={formData.fullDescription}
          onChange={(e) =>
            setFormData({ ...formData, fullDescription: e.target.value })
          }
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none h-20"
          placeholder="Detailed description"
        />
      </div>

      <div>
        <label className="text-sm text-gray-300 block mb-2">Architecture</label>
        <input
          type="text"
          value={formData.architecture}
          onChange={(e) =>
            setFormData({ ...formData, architecture: e.target.value })
          }
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          placeholder="e.g., Microservices, Monolithic"
        />
      </div>

      <div>
        <label className="text-sm text-gray-300 block mb-2">Total Phases</label>
        <input
          type="number"
          required
          min={1}
          value={formData.totalPhases}
          onChange={(e) =>
            setFormData({
              ...formData,
              totalPhases: parseInt(e.target.value) || 1,
            })
          }
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
