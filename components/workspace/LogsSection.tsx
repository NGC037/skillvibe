"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BookOpen } from "lucide-react";

interface ProgressLog {
  id: string;
  content: string;
  user: { name: string | null };
  createdAt: string;
}

interface LogsSectionProps {
  projectId: string;
  isTeamMember: boolean;
  onLogCreated?: () => void;
}

export default function LogsSection({
  projectId,
  isTeamMember,
  onLogCreated,
}: LogsSectionProps) {
  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLogContent, setNewLogContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/project/get-logs?projectId=${projectId}`);
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading logs");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      setLoading(true);
      void fetchLogs();
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

      if (!res.ok) throw new Error("Failed to create log");
      const log = await res.json();

      setLogs((currentLogs) => [log, ...currentLogs]);
      onLogCreated?.();
      setNewLogContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create log");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error && loading) {
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
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="w-6 h-6 text-purple-400" />
        <h3 className="text-2xl font-bold text-white">Progress Logs</h3>
      </div>

      {isTeamMember && (
        <form
          onSubmit={handleAddLog}
          className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="flex gap-2">
            <textarea
              id="workspace-log-input"
              value={newLogContent}
              onChange={(e) => setNewLogContent(e.target.value)}
              placeholder="Add a progress update..."
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none h-20"
            />
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !newLogContent.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 flex items-center gap-2 h-full"
              >
                <Send className="w-4 h-4" />
                Post
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <LogsSkeleton />
      ) : logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-white">No progress logs yet</p>
          <p className="mt-2 text-sm text-gray-400">
            {isTeamMember
              ? "Share the first update so the team can track momentum."
              : "Progress updates from the team will appear here."}
          </p>
          {isTeamMember ? (
            <button
              onClick={() => document.getElementById("workspace-log-input")?.focus()}
              className="mt-5 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/40 transition-all"
            >
              Write First Update
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {logs.map((log, idx) => (
              <motion.div
                key={log.id}
                layoutId={`log-${log.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {log.user?.name || "Unknown"}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(log.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {log.content}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {error && !loading && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
    </motion.div>
  );
}

function LogsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-lg border border-white/10 bg-white/5 p-4"
        >
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="mt-2 h-3 w-24 rounded-full bg-white/10" />
          <div className="mt-4 h-3 w-full rounded-full bg-white/10" />
          <div className="mt-2 h-3 w-4/5 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}
