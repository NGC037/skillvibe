"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, Plus, Edit2 } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  assignedTo?: { name: string | null } | null;
  createdAt: string;
}

interface TaskSectionProps {
  projectId: string;
  isTeamMember: boolean;
  onTaskUpdated?: () => void;
}

export default function TaskSection({
  projectId,
  isTeamMember,
  onTaskUpdated,
}: TaskSectionProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(
          `/api/project/get-tasks?projectId=${projectId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const data = await res.json();
        setTasks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading tasks");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      setLoading(true);
      void fetchTasks();
    }
  }, [projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.title.trim()) return;

    try {
      const res = await fetch("/api/project/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...newTaskData,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");
      const task = await res.json();
      setTasks((currentTasks) => [...currentTasks, task]);
      onTaskUpdated?.();
      setNewTaskData({ title: "", description: "" });
      setShowNewTask(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/project/update-task-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update task");
      const updatedTask = await res.json();
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updatedTask : task)),
      );
      onTaskUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((task) => task.status === "DONE");
  const totalTasks = tasks.length;
  const completedTasks = doneTasks.length;

  if (error) {
    return (
      <div className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-8 hover:shadow-xl hover:shadow-purple-500/10 transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white">Tasks</h3>
          {!loading && totalTasks > 0 ? (
            <p className="mt-1 text-sm text-gray-400">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          ) : null}
        </div>
        {isTeamMember && (
          <button
            onClick={() => setShowNewTask((current) => !current)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        )}
      </div>

      <AnimatePresence>
        {showNewTask && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateTask}
            className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg space-y-3"
          >
            <div>
              <input
                type="text"
                placeholder="Task title"
                value={newTaskData.title}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, title: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Description (optional)"
                value={newTaskData.description}
                onChange={(e) =>
                  setNewTaskData({
                    ...newTaskData,
                    description: e.target.value,
                  })
                }
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none h-20"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewTask(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <TaskBoardSkeleton />
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-white">No tasks yet</p>
          <p className="mt-2 text-sm text-gray-400">
            {isTeamMember
              ? "Create the first task to kick off the workspace."
              : "Tasks will appear here once your team starts planning work."}
          </p>
          {isTeamMember ? (
            <button
              onClick={() => setShowNewTask(true)}
              className="mt-5 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all"
            >
              Create First Task
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TaskColumn
            title="To Do"
            icon={Circle}
            color="bg-slate-600"
            tasks={todoTasks}
            onStatusChange={handleStatusChange}
            isTeamMember={isTeamMember}
          />
          <TaskColumn
            title="In Progress"
            icon={Edit2}
            color="bg-amber-600"
            tasks={inProgressTasks}
            onStatusChange={handleStatusChange}
            isTeamMember={isTeamMember}
          />
          <TaskColumn
            title="Done"
            icon={CheckCircle}
            color="bg-emerald-600"
            tasks={doneTasks}
            onStatusChange={handleStatusChange}
            isTeamMember={isTeamMember}
          />
        </div>
      )}
    </motion.div>
  );
}

interface TaskColumnProps {
  title: string;
  icon: React.ComponentType<{ className: string }>;
  color: string;
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  isTeamMember: boolean;
}

function TaskColumn({
  title,
  icon: Icon,
  color,
  tasks,
  onStatusChange,
  isTeamMember,
}: TaskColumnProps) {
  const nextStatus: Record<string, string | undefined> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "DONE",
    DONE: undefined,
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${color.replace("bg-", "text-")}`} />
        <h4 className="text-white font-semibold">{title}</h4>
        <span className="ml-auto px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task, idx) => (
            (() => {
              const nextTaskStatus = nextStatus[task.status];

              return (
            <motion.div
              key={task.id}
              layoutId={`task-${task.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() =>
                isTeamMember && nextTaskStatus
                  ? onStatusChange(task.id, nextTaskStatus)
                  : undefined
              }
              className={`p-3 bg-white/5 border border-white/10 rounded-lg transition-all ${
                isTeamMember && nextTaskStatus
                  ? "cursor-pointer hover:border-purple-500/50 hover:shadow-md hover:shadow-purple-500/20"
                  : "cursor-default"
              }`}
            >
              <p className="text-white font-semibold text-sm mb-1">
                {task.title}
              </p>
              {task.description && (
                <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}
              {task.assignedTo && (
                <p className="text-purple-300 text-xs">
                  Assigned: {task.assignedTo.name || "Unknown"}
                </p>
              )}
            </motion.div>
              );
            })()
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No tasks</div>
        )}
      </div>
    </div>
  );
}

function TaskBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div
          key={columnIndex}
          className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded-full bg-white/10" />
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="ml-auto h-5 w-8 rounded-full bg-white/10" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((__, taskIndex) => (
              <div
                key={taskIndex}
                className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
              >
                <div className="h-4 w-3/4 rounded-full bg-white/10" />
                <div className="h-3 w-full rounded-full bg-white/10" />
                <div className="h-3 w-1/2 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
