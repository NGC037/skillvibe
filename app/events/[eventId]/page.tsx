"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Loader, ArrowLeft, Check, Copy } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

type ParticipationStep =
  | "none"
  | "interested"
  | "confirmed"
  | "team_selection"
  | "in_team"
  | "request_sent"
  | "error";

interface EventData {
  id: string;
  title: string;
  description: string;
  minTeamSize: number;
  maxTeamSize: number;
  maxParticipants?: number;
}

interface UserTeam {
  id: string;
  code: string;
  name: string;
  leaderId: string;
  isLocked: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [participationStep, setParticipationStep] =
    useState<ParticipationStep>("none");
  const [userTeam, setUserTeam] = useState<UserTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [joinRequestCode, setJoinRequestCode] = useState<string | null>(null);

  // Fetch event details and user participation status
  useEffect(() => {
    const loadEventData = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        const [eventRes, participationRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/events/${eventId}/participation`),
        ]);

        if (!eventRes.ok) {
          throw new Error("Failed to fetch event");
        }

        const eventData = await eventRes.json();
        setEvent(eventData);

        if (participationRes.ok) {
          const participationData = await participationRes.json();
          const status = participationData.status;

          if (participationData.teamId) {
            setUserTeam({
              id: participationData.teamId,
              code: "",
              name: "",
              leaderId: "",
              isLocked: false,
            });
            setParticipationStep("in_team");
          } else if (status === "CONFIRMED") {
            setParticipationStep("team_selection");
          } else if (status === "INTERESTED") {
            setParticipationStep("interested");
          } else {
            setParticipationStep("none");
          }
        } else {
          setParticipationStep("none");
        }

        setError(null);
      } catch (err) {
        console.error("Load event error:", err);
        setError(err instanceof Error ? err.message : "Failed to load event");
        setParticipationStep("error");
      } finally {
        setLoading(false);
      }
    };

    loadEventData();
  }, [eventId, session?.user?.id]);

  const handleRegisterInterest = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/events/${eventId}/participation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INTERESTED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to register interest");
      }

      setParticipationStep("interested");
    } catch (err) {
      console.error("Register interest error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to register interest",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmParticipation = async () => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/events/${eventId}/participation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONFIRMED" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to confirm participation");
      }

      setParticipationStep("team_selection");
    } catch (err) {
      console.error("Confirm participation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to confirm participation",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  if (!event || participationStep === "error") {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
            <p className="text-rose-600 font-medium">
              {error || "Failed to load event"}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-6 space-y-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Event Header */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
              <h1 className="text-4xl font-bold text-slate-900">
                {event.title}
              </h1>
              <p className="mt-4 text-slate-600 leading-relaxed">
                {event.description}
              </p>
              <div className="mt-6 flex gap-4 text-sm">
                <div className="bg-slate-100 rounded-lg px-3 py-2">
                  <span className="text-slate-600 font-medium">
                    Team Size: {event.minTeamSize}-{event.maxTeamSize}
                  </span>
                </div>
                {event.maxParticipants && (
                  <div className="bg-slate-100 rounded-lg px-3 py-2">
                    <span className="text-slate-600 font-medium">
                      Max Participants: {event.maxParticipants}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Participation Flow */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Your Participation
              </h2>

              {/* Step 1: Register Interest */}
              {participationStep === "none" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <p className="text-slate-600">
                    Start by expressing your interest in this event.
                  </p>
                  <button
                    onClick={handleRegisterInterest}
                    disabled={actionLoading}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? "Registering..." : "Register Interest"}
                  </button>
                </motion.div>
              )}

              {/* Step 2: Confirm Participation */}
              {participationStep === "interested" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900">
                      ✓ You've registered interest in this event
                    </p>
                  </div>
                  <p className="text-slate-600">
                    Now confirm your participation to proceed with team
                    formation.
                  </p>
                  <button
                    onClick={handleConfirmParticipation}
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? "Confirming..." : "Confirm Participation"}
                  </button>
                </motion.div>
              )}

              {/* Step 3: Team Selection */}
              {participationStep === "team_selection" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-900">✓ Participation confirmed</p>
                  </div>
                  <p className="text-slate-600">
                    You're ready to form a team. Create a new team or join an
                    existing one.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
                    >
                      Create Team
                    </button>
                    <button
                      onClick={() => setShowJoinTeamModal(true)}
                      className="flex-1 border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 font-medium"
                    >
                      Join Team
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Request Sent */}
              {participationStep === "request_sent" && joinRequestCode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-900 font-medium">✓ Request sent!</p>
                    <p className="text-blue-800 text-sm mt-2">
                      Your request to join team{" "}
                      <span className="font-mono font-bold">
                        {joinRequestCode}
                      </span>{" "}
                      has been sent to the leader.
                    </p>
                  </div>
                  <p className="text-slate-600 text-sm">
                    You'll be notified when the leader approves or rejects your
                    request.
                  </p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-slate-200 text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-300 font-medium transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </motion.div>
              )}

              {/* Step 5: In Team */}
              {participationStep === "in_team" && userTeam && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-900 font-medium">
                      ✓ You're in a team!
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-slate-600 mb-3">Team Code:</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-indigo-600 font-mono">
                        {userTeam.code || "Loading..."}
                      </p>
                      {userTeam.code && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(userTeam.code || "");
                            alert("Team code copied!");
                          }}
                          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/dashboard/team/${userTeam.id}`)
                    }
                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                  >
                    Go to Team Dashboard
                  </button>
                </motion.div>
              )}

              {error && (
                <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <p className="text-rose-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Create Team Modal */}
        {showCreateTeamModal && event && (
          <CreateTeamModal
            eventId={eventId}
            maxTeamSize={event.maxTeamSize}
            onClose={() => setShowCreateTeamModal(false)}
            onSuccess={(team) => {
              setUserTeam(team);
              setParticipationStep("in_team");
              setShowCreateTeamModal(false);
            }}
          />
        )}

        {/* Join Team Modal */}
        {showJoinTeamModal && (
          <JoinTeamModal
            eventId={eventId}
            onClose={() => {
              setShowJoinTeamModal(false);
              setJoinRequestCode(null);
            }}
            onSuccess={(code) => {
              setJoinRequestCode(code);
              setParticipationStep("request_sent");
              setShowJoinTeamModal(false);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

interface CreateTeamModalProps {
  eventId: string;
  maxTeamSize?: number;
  onClose: () => void;
  onSuccess: (team: UserTeam) => void;
}

function CreateTeamModal({
  eventId,
  maxTeamSize = 4,
  onClose,
  onSuccess,
}: CreateTeamModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdTeam, setCreatedTeam] = useState<UserTeam | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      setError("Team name is required");
      return;
    }

    if (name.trim().length < 3) {
      setError("Team name must be at least 3 characters");
      return;
    }

    if (name.trim().length > 50) {
      setError("Team name must be 50 characters or less");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/events/${eventId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create team");
      }

      const team = await res.json();
      setCreatedCode(team.code);
      const teamData = {
        id: team.id,
        code: team.code,
        name: team.name,
        leaderId: team.leaderId,
        isLocked: team.isLocked,
      };
      setCreatedTeam(teamData);
      setSuccess(true);

      // Auto-redirect after 2.5 seconds ONLY if user hasn't interacted
      redirectTimeoutRef.current = setTimeout(() => {
        if (!hasUserInteracted) {
          onSuccess(teamData);
        }
      }, 2500);
    } catch (err) {
      console.error("Create team error:", err);
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  };
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && success && hasUserInteracted) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [success, hasUserInteracted]);

  // Focus modal on open
  useEffect(() => {
    if (success && modalRef.current) {
      modalRef.current.focus();
    }
  }, [success]);

  const handleCopyCode = async () => {
    setHasUserInteracted(true);
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    try {
      await navigator.clipboard.writeText(createdCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleGoToWorkspace = () => {
    setHasUserInteracted(true);
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    if (createdTeam) {
      onSuccess(createdTeam);
      router.push(`/dashboard/team/${createdTeam.id}/workspace`);
    }
  };

  const handleClose = () => {
    setHasUserInteracted(true);
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    if (createdTeam) {
      onSuccess(createdTeam);
    }
  };

  if (success && createdCode && createdTeam) {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4 },
      },
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-md bg-gradient-to-br from-white/95 to-white/90 rounded-3xl shadow-2xl p-8 text-center border border-white/20 backdrop-blur-xl"
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Celebration Icon */}
            <motion.div variants={itemVariants} className="flex justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut",
                }}
                className="text-6xl"
              >
                🎉
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 mb-2">
                Team Created Successfully!
              </h2>
              <p className="text-sm text-slate-500">
                Your team is ready to collaborate
              </p>
            </motion.div>

            {/* Member Count */}
            <motion.div
              variants={itemVariants}
              className="flex justify-center gap-2 text-sm text-slate-600"
            >
              <span className="font-medium">Members:</span>
              <span className="font-bold text-indigo-600">1/{maxTeamSize}</span>
            </motion.div>

            {/* Team Code with Glow Effect */}
            <motion.div variants={itemVariants}>
              <p className="text-xs text-slate-500 mb-3">Your Team Code</p>
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                {/* Glow Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-teal-500/20 rounded-2xl blur-lg" />

                {/* Code Container */}
                <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200/50">
                  <motion.p
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(79, 70, 229, 0)",
                        "0 0 20px rgba(79, 70, 229, 0.3)",
                        "0 0 10px rgba(79, 70, 229, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-4xl font-bold text-indigo-600 font-mono tracking-widest"
                  >
                    {createdCode}
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>

            {/* Subtext */}
            <motion.p
              variants={itemVariants}
              className="text-sm text-slate-600 px-2"
            >
              Share this code with your teammates so they can join your team.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyCode}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg font-medium transition-all flex items-center justify-center gap-2 group"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Copy Code</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoToWorkspace}
                className="w-full px-4 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl hover:bg-indigo-50 font-medium transition-all"
              >
                Go to Workspace
              </motion.button>
            </motion.div>

            {/* Auto-redirect Timer */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-2 text-xs text-slate-400"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-3 h-3 border-2 border-slate-300 border-t-indigo-600 rounded-full" />
              </motion.div>
              <span>
                {hasUserInteracted
                  ? "Redirecting when ready..."
                  : "Auto-redirecting..."}
              </span>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Create New Team
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Tech Warriors"
              aria-label="Team name"
              maxLength={50}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              {name.length}/50 characters
            </p>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 rounded-lg p-3"
            >
              <p className="text-rose-600 text-sm">{error}</p>
            </motion.div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors"
              disabled={loading || name.trim().length < 3}
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface JoinTeamModalProps {
  eventId: string;
  onClose: () => void;
  onSuccess: (code: string) => void;
}

function JoinTeamModal({ eventId, onClose, onSuccess }: JoinTeamModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) {
      setError("Please enter a valid 6-digit team code");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const upperCode = code.toUpperCase();
      const res = await fetch(`/api/team/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: upperCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send join request");
      }

      // Tell parent about the successful request
      onSuccess(upperCode);
    } catch (err) {
      console.error("Join team error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send join request",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-4">
          Join Existing Team
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Team Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="XXXXXX"
              aria-label="Team code"
              maxLength={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-center text-lg tracking-widest transition-all"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-2">
              Ask your team leader for the 6-digit team code
            </p>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 rounded-lg p-3"
            >
              <p className="text-rose-600 text-sm">{error}</p>
            </motion.div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 transition-colors"
              disabled={loading || code.trim().length < 6}
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
