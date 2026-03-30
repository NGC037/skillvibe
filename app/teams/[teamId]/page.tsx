"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TeamIntel = {
  matchScore: number;
  missingSkills: string[];
  teamSkills: string[];
};

type TeamRequest = {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type TeamData = {
  id: string;
  leaderId: string;
  isLocked: boolean;
  members: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  event: {
    id: string;
    title: string;
    minTeamSize: number;
    maxTeamSize: number;
  };
};

function getMatchTone(matchScore: number) {
  if (matchScore >= 80) {
    return {
      bar: "bg-green-500",
      badge: "bg-green-100 text-green-700",
      border: "border-green-200",
      surface: "from-green-50 to-emerald-50",
    };
  }

  if (matchScore >= 50) {
    return {
      bar: "bg-amber-500",
      badge: "bg-amber-100 text-amber-700",
      border: "border-amber-200",
      surface: "from-amber-50 to-yellow-50",
    };
  }

  return {
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700",
    border: "border-red-200",
    surface: "from-red-50 to-rose-50",
  };
}

export default function TeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { teamId } = use(params);

  const [intel, setIntel] = useState<TeamIntel | null>(null);
  const [team, setTeam] = useState<TeamData | null>(null);
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [intelError, setIntelError] = useState<string | null>(null);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [lockLoading, setLockLoading] = useState(false);
  const isLeader = team?.leaderId === session?.user?.id;
  const isMember = team?.members.some((member) => member.userId === session?.user?.id) ?? false;

  const fetchTeam = useCallback(async () => {
    try {
      setTeamError(null);
      const res = await fetch(`/api/teams/${teamId}`);
      const data = await res.json();

      if (!res.ok) {
        setTeam(null);
        setTeamError(data?.error ?? "Failed to fetch team");
        return;
      }

      setTeam(data);
    } catch (error) {
      console.error("Team fetch error:", error);
      setTeam(null);
      setTeamError("Failed to fetch team");
    }
  }, [teamId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetchTeam();
  }, [fetchTeam, status]);

  useEffect(() => {
    if (!team) return;

    const fetchIntel = async () => {
      try {
        setIntelError(null);
        const res = await fetch(`/api/team/intelligence/${teamId}`);

        if (!res.ok) {
          const errorData = await res.json();
          setIntel(null);
          setIntelError(errorData?.error ?? "Failed to fetch intelligence");
          return;
        }

        const data = (await res.json()) as TeamIntel;
        setIntel(data);
      } catch (error) {
        console.error("Intel fetch error:", error);
        setIntel(null);
        setIntelError("Failed to fetch intelligence");
      }
    };

    fetchIntel();
  }, [team, teamId]);

  useEffect(() => {
    if (!team || team.leaderId !== session?.user?.id) return;

    const fetchRequests = async () => {
      try {
        setRequestsError(null);
        const res = await fetch(`/api/team/requests/${teamId}`);
        const data = await res.json();

        if (!res.ok) {
          setRequests([]);
          setRequestsError(data?.error ?? "Failed to fetch requests");
          return;
        }

        setRequests(data.requests ?? []);
      } catch (error) {
        console.error("Request fetch error:", error);
        setRequests([]);
        setRequestsError("Failed to fetch requests");
      }
    };

    fetchRequests();
  }, [session?.user?.id, team, teamId]);

  useEffect(() => {
    if (!team) return;
    if (isMember || isLeader) return;
    router.push("/dashboard");
  }, [isLeader, isMember, router, team]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="surface-card-strong p-8">
          <div className="shimmer-skeleton h-8 w-48 rounded-full" />
          <div className="shimmer-skeleton mt-4 h-4 w-60 rounded-full" />
        </div>
        <div className="surface-card p-6 space-y-4">
          <div className="shimmer-skeleton h-5 w-24 rounded-full" />
          <div className="shimmer-skeleton h-3 w-full rounded-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <p className="p-6">Not logged in</p>;
  }

  if (teamError) {
    return <p className="p-6 text-red-600">{teamError}</p>;
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="surface-card-strong p-8">
          <div className="shimmer-skeleton h-8 w-40 rounded-full" />
          <div className="shimmer-skeleton mt-4 h-4 w-72 rounded-full" />
        </div>
        <div className="surface-card p-6 space-y-4">
          <div className="shimmer-skeleton h-5 w-24 rounded-full" />
          <div className="shimmer-skeleton h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isMember && !isLeader) {
    return null;
  }

  const memberCount = team.members.length;
  const progress = (memberCount / team.event.maxTeamSize) * 100;
  const matchTone = getMatchTone(intel?.matchScore ?? 0);

  const handleRequestAction = async (
    requestId: string,
    action: "approve" | "reject",
  ) => {
    const res = await fetch(`/api/team/request/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requestId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setRequestsError(data?.error ?? `Failed to ${action} request`);
      return;
    }

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId
          ? { ...request, status: action === "approve" ? "APPROVED" : "REJECTED" }
          : request,
      ),
    );

    if (action === "approve") {
      await fetchTeam();
    }
  };

  const handleLock = async () => {
    try {
      setLockLoading(true);
      setTeamError(null);

      const formData = new FormData();
      formData.append("teamId", teamId);

      const res = await fetch("/api/teams/lock", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setTeamError(data?.error ?? "Failed to lock team");
        return;
      }

      await fetchTeam();
    } catch (error) {
      console.error("Lock team error:", error);
      setTeamError("Failed to lock team");
    } finally {
      setLockLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 p-8 text-white shadow-[0_24px_70px_-30px_rgba(79,70,229,0.55)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/65">
              Team workspace
            </p>
            <h1 className="mt-3 text-3xl font-bold">Team Management</h1>
            <p className="mt-2 text-white/85">Event: {team.event.title}</p>
          </div>

          <div className="rounded-[1.5rem] bg-white/12 px-5 py-4 text-white backdrop-blur">
            <p className="text-xs text-white/65">Team status</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xl font-semibold">{memberCount} members</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  team.isLocked
                    ? "bg-neutral-900 text-white"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {team.isLocked ? "LOCKED" : "UNLOCKED"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-500">Team ID</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {team.id.slice(0, 8)}
              </p>
            </div>

            <div className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700">
              {team.event.minTeamSize} min / {team.event.maxTeamSize} max
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm text-neutral-600">
              <span>Team Size</span>
              <span>
                {memberCount} / {team.event.maxTeamSize}
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {isLeader && !team.isLocked ? (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-amber-800">Finalize team access</p>
                <p className="mt-1 text-xs text-amber-700">
                  Locking prevents any new join requests or member additions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleLock()}
                disabled={lockLoading}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {lockLoading ? "Locking..." : "Lock Team"}
              </button>
            </div>
          ) : null}
        </div>

        {intel ? (
          <div
            className={`surface-card border ${matchTone.border} bg-gradient-to-br ${matchTone.surface} p-6`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-600">Team Intelligence</p>
                <p className="mt-2 text-3xl font-semibold text-neutral-900">
                  {intel.matchScore}%
                </p>
              </div>

              <span className={`rounded-full px-3 py-1 text-xs font-medium ${matchTone.badge}`}>
                {intel.matchScore >= 80
                  ? "Strong fit"
                  : intel.matchScore >= 50
                    ? "Partial fit"
                    : "Needs coverage"}
              </span>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm text-neutral-600">
                <span>Match score</span>
                <span>{intel.matchScore}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/80">
                <div
                  className={`${matchTone.bar} h-3 rounded-full transition-all`}
                  style={{ width: `${intel.matchScore}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-card p-6 space-y-4 animate-pulse">
            <div className="shimmer-skeleton h-4 w-32 rounded-full" />
            <div className="shimmer-skeleton h-8 w-24 rounded-2xl" />
            <div className="shimmer-skeleton h-3 w-full rounded-full" />
          </div>
        )}
      </div>

      <div className="surface-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Team Members</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Everyone currently in this team workspace.
            </p>
          </div>
          <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            {memberCount} active
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {team.members.map((member) => (
            <div
              key={member.id}
              className="interactive-card rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-neutral-900">{member.user.name}</p>
                  <p className="mt-1 text-sm text-neutral-500">{member.user.email}</p>
                </div>

                {member.userId === team.leaderId ? (
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                    Leader
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLeader ? (
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Join Requests</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Review incoming requests before adding members.
              </p>
            </div>
            <span className="text-sm text-neutral-500">{requests.length} total</span>
          </div>

          {requestsError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {requestsError}
            </p>
          ) : null}

          {requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
              No join requests yet.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-white to-neutral-50 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {request.user.name ?? "Unnamed user"}
                      </p>
                      <p className="text-sm text-neutral-500">{request.user.email}</p>
                      <p className="mt-1 text-xs text-neutral-400">
                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          request.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : request.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {request.status}
                      </span>

                      {request.status === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, "approve")}
                            className="rounded-xl bg-green-600 px-3 py-2 text-sm text-white transition hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(request.id, "reject")}
                            className="rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white transition hover:bg-black"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {!intel && !intelError ? (
        <div className="surface-card p-6 space-y-4 animate-pulse">
          <div className="shimmer-skeleton h-4 w-32 rounded-full" />
          <div className="shimmer-skeleton h-8 w-40 rounded-2xl" />
          <div className="shimmer-skeleton h-3 w-full rounded-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-100 p-4 space-y-3">
              <div className="shimmer-skeleton h-4 w-24 rounded-full" />
              <div className="flex flex-wrap gap-2">
                <div className="shimmer-skeleton h-7 w-20 rounded-full" />
                <div className="shimmer-skeleton h-7 w-24 rounded-full" />
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-100 p-4 space-y-3">
              <div className="shimmer-skeleton h-4 w-24 rounded-full" />
              <div className="flex flex-wrap gap-2">
                <div className="shimmer-skeleton h-7 w-16 rounded-full" />
                <div className="shimmer-skeleton h-7 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {intel ? (
        <div
          className={`surface-card border ${matchTone.border} bg-gradient-to-br ${matchTone.surface} p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-600">Skill Coverage</p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">
                Match Score: {intel.matchScore}%
              </p>
            </div>

            <span className={`rounded-full px-3 py-1 text-xs font-medium ${matchTone.badge}`}>
              {intel.matchScore >= 80
                ? "Strong fit"
                : intel.matchScore >= 50
                  ? "Partial fit"
                  : "Needs coverage"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
              <p className="mb-3 text-sm font-medium text-red-600">Missing Skills</p>

              {intel.missingSkills.length === 0 ? (
                <p className="text-sm text-green-700">All required skills covered</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {intel.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
              <p className="mb-3 text-sm font-medium text-green-700">Team Skills</p>

              {intel.teamSkills.length === 0 ? (
                <p className="text-sm text-neutral-500">No team skills added yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {intel.teamSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {intelError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {intelError}
        </div>
      ) : null}

      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
