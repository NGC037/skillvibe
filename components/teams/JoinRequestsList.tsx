import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader } from "lucide-react";

interface JoinRequest {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  createdAt: string;
}

interface JoinRequestsListProps {
  teamId: string;
  isLeader: boolean;
  onRequestProcessed?: () => void;
}

export function JoinRequestsList({
  teamId,
  isLeader,
  onRequestProcessed,
}: JoinRequestsListProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<
    "approve" | "reject" | null
  >(null);

  useEffect(() => {
    if (!isLeader) return;

    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/teams/${teamId}/join-requests`);

        if (!res.ok) {
          throw new Error("Failed to fetch join requests");
        }

        const data = await res.json();
        setRequests(data);
        setError(null);
      } catch (err) {
        console.error("Fetch join requests error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch join requests",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [teamId, isLeader]);

  const handleApprove = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      setProcessingAction("approve");
      const res = await fetch(`/api/team/request/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve request");
      }

      // Remove the request from UI immediately
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onRequestProcessed?.();
    } catch (err) {
      console.error("Approve error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to approve request";
      alert(message);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setProcessingId(requestId);
      setProcessingAction("reject");
      const res = await fetch(`/api/team/request/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject request");
      }

      // Remove the request from UI immediately
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      onRequestProcessed?.();
    } catch (err) {
      console.error("Reject error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to reject request";
      alert(message);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  if (!isLeader) return null;

  if (loading) {
    return (
      <div className="rounded-xl bg-white/10 p-6 border border-white/20">
        <div className="flex items-center justify-center gap-2 text-white/80">
          <Loader className="h-5 w-5 animate-spin" />
          Loading join requests...
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl bg-white/10 p-6 border border-white/20 text-center">
        <p className="text-white/60">No pending join requests at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">
        Pending Join Requests ({requests.length})
      </h3>
      <div className="space-y-3">
        <AnimatePresence>
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between rounded-lg border border-white/20 bg-white/10 p-4 backdrop-blur"
            >
              <div className="flex-1">
                <p className="font-medium text-white">
                  {request.user.name || "Unknown User"}
                </p>
                <p className="text-sm text-white/60">{request.user.email}</p>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleApprove(request.id)}
                  disabled={processingId !== null}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-500/20 border border-green-500/40 px-3 py-2 text-green-300 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label={`Approve ${request.user.name}'s request`}
                >
                  {processingId === request.id &&
                  processingAction === "approve" ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">
                    {processingId === request.id &&
                    processingAction === "approve"
                      ? "Approving..."
                      : "Approve"}
                  </span>
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  disabled={processingId !== null}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 border border-red-500/40 px-3 py-2 text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label={`Reject ${request.user.name}'s request`}
                >
                  {processingId === request.id &&
                  processingAction === "reject" ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium">
                    {processingId === request.id &&
                    processingAction === "reject"
                      ? "Rejecting..."
                      : "Reject"}
                  </span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
