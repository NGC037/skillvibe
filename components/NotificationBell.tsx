"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  type?: string | null;
  requestId?: string | null;
  actionable?: boolean;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      const data = await res.json();

      if (!res.ok) {
        return;
      }

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
    setUnreadCount(0);
  };

  const handleRequestAction = async (
    action: "approve" | "reject",
    requestId: string,
  ) => {
    try {
      setBusyRequestId(requestId);
      setFeedback("");

      const res = await fetch(`/api/team/request/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? `Failed to ${action} request`);
      }

      setFeedback(action === "approve" ? "Request approved" : "Request rejected");
      await loadNotifications();
    } catch (error) {
      console.error("NOTIFICATION ACTION ERROR:", error);
      setFeedback(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyRequestId(null);
      window.setTimeout(() => setFeedback(""), 2000);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);

          if (nextOpen && unreadCount > 0) {
            void markAllRead();
          }
        }}
        className="relative w-10 h-10 rounded-2xl border border-white/70 bg-white/80 hover:bg-white transition flex items-center justify-center shadow-sm"
      >
        <Bell size={18} className="text-neutral-700" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24">
            <motion.button
              type="button"
              aria-label="Close notifications"
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative z-50 w-full max-w-md rounded-2xl bg-white/90 shadow-xl backdrop-blur-md border border-white/70 overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-teal-50">
                <div>
                  <p className="font-semibold text-neutral-900">Notifications</p>
                  <p className="text-xs text-neutral-500 mt-1">Recent platform updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Close
                </button>
              </div>

              {feedback ? (
                <div className="border-b border-neutral-100 bg-green-50 px-5 py-3 text-sm text-green-700">
                  {feedback}
                </div>
              ) : null}

              <div className="max-h-[70vh] overflow-y-auto p-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-neutral-100 bg-white p-4"
                      >
                        <div className="shimmer-skeleton h-4 w-3/4 rounded-full" />
                        <div className="shimmer-skeleton mt-3 h-3 w-1/2 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-5 text-sm text-neutral-500">No notifications yet.</div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        whileHover={{ scale: 1.01 }}
                        className="rounded-2xl border border-neutral-100 bg-white px-4 py-4 shadow-sm"
                      >
                        <p className="text-sm text-neutral-800">{notification.message}</p>
                        <p className="text-xs text-neutral-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>

                        {notification.type === "TEAM_REQUEST" &&
                        notification.requestId &&
                        notification.actionable ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleRequestAction("approve", notification.requestId!)
                              }
                              disabled={busyRequestId === notification.requestId}
                              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyRequestId === notification.requestId ? "Working..." : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleRequestAction("reject", notification.requestId!)
                              }
                              disabled={busyRequestId === notification.requestId}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busyRequestId === notification.requestId ? "Working..." : "Reject"}
                            </button>
                          </div>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
