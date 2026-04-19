"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightLeft, Plus, Trash2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignedToId?: string | null;
  assignedTo?: { name: string | null; email?: string | null } | null;
  createdAt: string;
}

interface TeamMemberOption {
  id: string;
  name: string | null;
  email: string;
}

interface TaskSectionProps {
  projectId: string;
  currentUserId: string;
  canManageTasks: boolean;
  teamMembers: TeamMemberOption[];
  viewMode?: "leader" | "member";
  onTaskUpdated?: () => void;
}

type TaskResponse = {
  tasks: Task[];
  canManageTasks: boolean;
  canViewAllTasks: boolean;
  currentUserId: string;
};

const statuses: Array<Task["status"]> = ["TODO", "IN_PROGRESS", "DONE"];
const statusMeta: Record<
  Task["status"],
  { chip: string; button: string; cardGlow: string; label: string }
> = {
  TODO: {
    chip: "border-neutral-300 bg-neutral-100 text-neutral-700",
    button: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
    cardGlow: "from-white to-neutral-50",
    label: "To Do",
  },
  IN_PROGRESS: {
    chip: "border-sky-200 bg-sky-100 text-sky-700",
    button: "border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
    cardGlow: "from-sky-50/80 to-white",
    label: "In Progress",
  },
  DONE: {
    chip: "border-emerald-200 bg-emerald-100 text-emerald-700",
    button: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    cardGlow: "from-emerald-50/80 to-white",
    label: "Done",
  },
};

export default function TaskSection({
  projectId,
  currentUserId,
  canManageTasks,
  teamMembers,
  viewMode = "leader",
  onTaskUpdated,
}: TaskSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [taskPermissions, setTaskPermissions] = useState({
    canManageTasks,
    canViewAllTasks: canManageTasks,
  });
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    assignedToId: "",
  });

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/project/get-tasks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = (await res.json()) as TaskResponse;
      setTasks(data.tasks);
      setTaskPermissions({
        canManageTasks: data.canManageTasks,
        canViewAllTasks: data.canViewAllTasks,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      void loadTasks();
    }
  }, [projectId]);

  const taskSummary = useMemo(() => {
    const effectiveCanViewAllTasks =
      taskPermissions.canViewAllTasks && viewMode === "leader";
    const visibleTasks = effectiveCanViewAllTasks
      ? tasks
      : tasks.filter((task) => task.assignedToId === currentUserId);
    const completed = visibleTasks.filter((task) => task.status === "DONE").length;
    return {
      total: visibleTasks.length,
      completed,
      mine: visibleTasks.filter((task) => task.assignedToId === currentUserId).length,
    };
  }, [currentUserId, taskPermissions.canViewAllTasks, tasks, viewMode]);

  const effectiveCanManageTasks =
    taskPermissions.canManageTasks && viewMode === "leader";
  const effectiveCanViewAllTasks =
    taskPermissions.canViewAllTasks && viewMode === "leader";
  const visibleTasks = effectiveCanViewAllTasks
    ? tasks
    : tasks.filter((task) => task.assignedToId === currentUserId);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title.trim()) return;

    try {
      const res = await fetch("/api/project/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: newTaskData.title,
          description: newTaskData.description,
          assignedToId: newTaskData.assignedToId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      setTasks((currentTasks) => [...currentTasks, data]);
      setNewTaskData({ title: "", description: "", assignedToId: "" });
      setShowNewTask(false);
      onTaskUpdated?.();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleStatusChange = async (taskId: string, status: Task["status"]) => {
    setBusyTaskId(taskId);

    try {
      const res = await fetch("/api/project/update-task-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? data : task)),
      );
      onTaskUpdated?.();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleReassignTask = async (taskId: string, assignedToId: string) => {
    setBusyTaskId(taskId);

    try {
      const res = await fetch("/api/project/reassign-task", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          assignedToId: assignedToId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reassign task");

      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? data : task)),
      );
      onTaskUpdated?.();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reassign task");
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setBusyTaskId(taskId);

    try {
      const res = await fetch(`/api/project/delete-task?taskId=${taskId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete task");

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      onTaskUpdated?.();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.9rem] border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
            Workspace Tasks
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            {effectiveCanViewAllTasks ? "Team Tasks" : "My Tasks"}
          </h3>
          <p className="mt-1 text-sm text-slate-200">
            {effectiveCanViewAllTasks
              ? `${taskSummary.completed} of ${taskSummary.total} tasks completed`
              : `${taskSummary.mine} tasks assigned to you`}
          </p>
        </div>

        {effectiveCanManageTasks ? (
          <button
            type="button"
            onClick={() => setShowNewTask((current) => !current)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-white to-white/90 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        ) : null}
      </div>

      {showNewTask ? (
        <form
          onSubmit={handleCreateTask}
          className="mt-6 space-y-3 rounded-[1.6rem] border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-xl"
        >
          <input
            type="text"
            placeholder="Task title"
            value={newTaskData.title}
            onChange={(e) =>
              setNewTaskData((current) => ({ ...current, title: e.target.value }))
            }
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
            required
          />
          <textarea
            placeholder="Description"
            value={newTaskData.description}
            onChange={(e) =>
              setNewTaskData((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            className="min-h-24 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
          />
          <select
            value={newTaskData.assignedToId}
            onChange={(e) =>
              setNewTaskData((current) => ({
                ...current,
                assignedToId: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none"
          >
            <option value="">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id} className="text-slate-900">
                {member.name || member.email}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create Task
            </button>
            <button
              type="button"
              onClick={() => setShowNewTask(false)}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center text-slate-300">
          No tasks yet 🚀 Start by assigning one
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {visibleTasks.map((task) => {
            const canUpdateStatus =
              effectiveCanManageTasks || task.assignedToId === currentUserId;
            const currentStatus = statusMeta[task.status];

            return (
              <motion.div
                key={task.id}
                whileHover={{ y: -4 }}
              className={`rounded-[1.7rem] border border-white/25 bg-gradient-to-br ${currentStatus.cardGlow} p-5 text-neutral-900 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.5)] transition-all duration-300 hover:scale-[1.01] hover:border-cyan-200/70 hover:shadow-xl`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">{task.title}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {task.description || "No description added yet."}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${currentStatus.chip}`}>
                    {currentStatus.label}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-200 bg-white/70 px-4 py-3 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Assigned To
                    </p>
                    <p className="mt-2 text-sm font-medium text-neutral-900">
                      {task.assignedTo?.name || "Unassigned"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-white/70 px-4 py-3 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Created
                    </p>
                    <p className="mt-2 text-sm font-medium text-neutral-900">
                      {new Date(task.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    Status Flow
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={!canUpdateStatus || busyTaskId === task.id}
                        onClick={() => handleStatusChange(task.id, status)}
                        className={`rounded-full px-3 py-2 text-xs font-medium transition-all duration-300 ${
                          task.status === status
                            ? statusMeta[status].button
                            : "border border-neutral-200 bg-white/75 text-neutral-600 hover:bg-white"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {statusMeta[status].label}
                      </button>
                    ))}
                  </div>
                </div>

                {effectiveCanManageTasks ? (
                  <div className="mt-5 space-y-3 border-t border-neutral-200 pt-4">
                    <label className="block text-xs uppercase tracking-[0.18em] text-neutral-500">
                      Reassign Task
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="flex-1">
                        <select
                          value={task.assignedToId || ""}
                          onChange={(e) => handleReassignTask(task.id, e.target.value)}
                          disabled={busyTaskId === task.id}
                          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition-all duration-300 hover:border-indigo-200"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option
                              key={member.id}
                              value={member.id}
                              className="text-slate-900"
                            >
                              {member.name || member.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={busyTaskId === task.id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition-all duration-300 hover:bg-rose-100 hover:shadow-md disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Task
                      </button>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs text-neutral-500">
                      <ArrowRightLeft className="h-4 w-4" />
                      Leader-only assignment controls
                    </div>
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
