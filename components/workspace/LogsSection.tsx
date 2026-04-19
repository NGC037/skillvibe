"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Send } from "lucide-react";

interface ProgressLog {
  id: string;
  content: string;
  userId: string;
  user: { name: string | null };
  createdAt: string;
}

interface LogsSectionProps {
  projectId: string;
  canManageTasks: boolean;
  viewMode?: "leader" | "member";
  onLogCreated?: () => void;
}

type LogsResponse = {
  logs: ProgressLog[];
  canViewAllLogs: boolean;
  currentUserId: string;
};

export default function LogsSection({
  projectId,
  canManageTasks,
  viewMode = "leader",
  onLogCreated,
}: LogsSectionProps) {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLogContent, setNewLogContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canViewAllLogs, setCanViewAllLogs] = useState(canManageTasks);
  const [currentUserId, setCurrentUserId] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/project/get-logs?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = (await res.json()) as LogsResponse;
      setLogs(data.logs);
      setCanViewAllLogs(data.canViewAllLogs);
      setCurrentUserId(data.currentUserId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading logs");
    } finally {
      setLoading(false);
    }
  };

  const effectiveCanViewAllLogs = canViewAllLogs && viewMode === "leader";
  const visibleLogs = effectiveCanViewAllLogs
    ? logs
    : logs.filter((log) => log.userId === currentUserId);

  useEffect(() => {
    if (projectId) {
      void loadLogs();
    }
  }, [projectId]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/project/create-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          content: newLogContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create log");

      setLogs((currentLogs) => [data, ...currentLogs]);
      setNewLogContent("");
      onLogCreated?.();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.9rem] border border-white/20 bg-white/10 p-8 shadow-xl backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-cyan-300" />
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
            Progress Journal
          </p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            {effectiveCanViewAllLogs ? "Workspace Logs" : "My Task Logs"}
          </h3>
          <p className="mt-1 text-sm text-slate-200">
            {effectiveCanViewAllLogs
              ? "Track delivery notes across the workspace."
              : "Your personal execution updates and task notes."}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleAddLog}
        className="mt-6 rounded-[1.6rem] border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-xl"
      >
        <div className="flex flex-col gap-3 md:flex-row">
          <textarea
            value={newLogContent}
            onChange={(e) => setNewLogContent(e.target.value)}
            placeholder="Share a progress update..."
            className="min-h-24 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-300/70"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newLogContent.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Post Log
          </button>
        </div>
      </form>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : visibleLogs.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center text-slate-300">
          No activity yet
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {visibleLogs.map((log) => (
            <motion.div
              key={log.id}
              whileHover={{ y: -2 }}
              className="rounded-[1.5rem] border border-white/25 bg-white/82 p-5 text-neutral-900 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.45)] backdrop-blur transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 via-indigo-500 to-teal-400 text-sm font-semibold text-white shadow-md">
                    {getInitials(log.user?.name || "Unknown")}
                  </div>
                  <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {log.user?.name || "Unknown"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-neutral-500">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium leading-6 text-neutral-700">{log.content}</p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
