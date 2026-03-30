"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type EventCardProps = {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  minTeamSize: number;
  maxTeamSize: number;
};

type TeamSummary = {
  id: string;
  code: string;
  leaderId: string;
  members: Array<{ userId: string }>;
  currentUserRequestStatus: string | null;
};

type CreatedTeamState = {
  teamId: string;
  teamCode: string;
};

export default function EventCard({
  id,
  title,
  description,
  requiredSkills,
  minTeamSize,
  maxTeamSize,
}: EventCardProps) {
  const [skills, setSkills] = useState<string[]>([]);
  const [status, setStatus] =
    useState<"NOT_INTERESTED" | "INTERESTED" | "CONFIRMED">("NOT_INTERESTED");
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [myTeam, setMyTeam] = useState<TeamSummary | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [createdTeam, setCreatedTeam] = useState<CreatedTeamState | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setCurrentUserId(data?.user?.id || null);
      });
  }, []);

  useEffect(() => {
    fetch("/api/users/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setSkills(data.userSkills.map((userSkill: { skill: { name: string } }) => userSkill.skill.name));
        }
      });
  }, []);

  const loadTeams = useCallback(async () => {
    const res = await fetch(`/api/events/${id}/teams`);
    const data = await res.json();
    const safeTeams = Array.isArray(data) ? data : [];
    setTeams(safeTeams);

    const sessionRes = await fetch("/api/auth/session");
    const sessionData = await sessionRes.json();
    const activeUserId = sessionData?.user?.id;

    const mine = safeTeams.find((team: TeamSummary) =>
      team.members.some((member) => member.userId === activeUserId),
    );

    setMyTeam(mine ?? null);
  }, [id]);

  useEffect(() => {
    const loadParticipationAndTeams = async () => {
      const res = await fetch("/api/users/participations");
      const data = await res.json();

      if (Array.isArray(data)) {
        const existing = data.find(
          (participation: { eventId: string; status: typeof status }) =>
            participation.eventId === id,
        );

        if (existing) {
          setStatus(existing.status);
        }
      }

      await loadTeams();
    };

    void loadParticipationAndTeams();
  }, [id, loadTeams]);

  const matchedSkills = requiredSkills.filter((requiredSkill) =>
    skills.map((skill) => skill.toLowerCase()).includes(requiredSkill.toLowerCase()),
  );

  const hasRequiredSkills = requiredSkills.length > 0;

  const readinessPercentage = useMemo(() => {
    if (requiredSkills.length === 0) {
      return 100;
    }

    if (skills.length === 0) {
      return 0;
    }

    return Math.round((matchedSkills.length / requiredSkills.length) * 100);
  }, [matchedSkills.length, requiredSkills.length, skills.length]);

  const pendingRequests = teams.filter(
    (team) => team.currentUserRequestStatus === "PENDING",
  );
  const selectedTeam = teams.find((team) => team.code === joinCode);
  const selectedTeamIsFull =
    selectedTeam?.members.length !== undefined &&
    selectedTeam.members.length >= maxTeamSize;
  const selectedTeamIsPending = selectedTeam?.currentUserRequestStatus === "PENDING";

  const confirmParticipation = async () => {
    await fetch("/api/users/participations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: id }),
    });

    setStatus("CONFIRMED");
    router.refresh();
  };

  const createTeam = async () => {
    if (!name.trim()) {
      setMessage("Enter your name first");
      return;
    }

    const res = await fetch(`/api/events/${id}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (data.error) {
      setMessage(data.error);
      return;
    }

    setMyTeam(data);
    setCreatedTeam({
      teamId: data.teamId ?? data.id,
      teamCode: data.code,
    });
    setMode(null);
    setMessage("Team created successfully!");
    await loadTeams();
    router.refresh();
  };

  const copyTeamCode = async () => {
    if (!createdTeam?.teamCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdTeam.teamCode);
      setCopyMessage("Code copied!");
      window.setTimeout(() => setCopyMessage(""), 2000);
    } catch (error) {
      console.error("Copy code error:", error);
      setCopyMessage("Failed to copy code");
      window.setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  const requestToJoinTeam = async () => {
    const res = await fetch("/api/team/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: joinCode }),
    });

    const data = await res.json();

    if (data.error) {
      setMessage(data.error);
      return;
    }

    setMode(null);
    setJoinCode("");
    setMessage(`Request sent to team ${data.team.code}.`);
    loadTeams();
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-2 text-black">{title}</h3>

      <p className="text-black mb-3">{description}</p>

      <div className="mb-3">
        <p className="text-sm font-semibold text-black mb-1">Required Skills:</p>

        <div className="flex flex-wrap gap-2">
          {requiredSkills.map((skill) => {
            const matched = skills
              .map((existingSkill) => existingSkill.toLowerCase())
              .includes(skill.toLowerCase());

            return (
              <span
                key={skill}
                className={`px-3 py-1 rounded-full text-sm ${
                  matched ? "bg-green-200 text-black" : "bg-red-200 text-black"
                }`}
              >
                {skill}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm font-semibold text-black">
          Skill Match: {!hasRequiredSkills ? "N/A" : `${readinessPercentage}%`}
        </p>

        {hasRequiredSkills ? (
          <div className="w-full h-2 bg-neutral-200 rounded-full mt-1">
            <div
              className={`h-2 bg-blue-600 rounded-full ${
                readinessPercentage === 0
                  ? "w-0"
                  : readinessPercentage <= 25
                    ? "w-1/4"
                    : readinessPercentage <= 50
                      ? "w-1/2"
                      : readinessPercentage <= 75
                        ? "w-3/4"
                        : "w-full"
              }`}
            />
          </div>
        ) : null}
      </div>

      {status === "NOT_INTERESTED" ? (
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setStatus("INTERESTED");
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Register Interest
        </button>
      ) : null}

      {status === "INTERESTED" ? (
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void confirmParticipation();
          }}
          disabled={readinessPercentage < 50}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Confirm Participation
        </button>
      ) : null}

      {status === "CONFIRMED" ? (
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <h4 className="text-sm font-semibold text-black mb-3">Team Formation</h4>

          {!myTeam && pendingRequests.length > 0 ? (
            <div className="mb-4 space-y-2">
              {pendingRequests.map((team) => (
                <div
                  key={team.id}
                  className="border border-amber-200 bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800"
                >
                  Request pending for team {team.code}
                </div>
              ))}
            </div>
          ) : null}

          {!myTeam && !mode ? (
            <div className="flex gap-3 mb-3">
              <button
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setMode("create");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full"
              >
                Create New Team
              </button>

              <button
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setMode("join");
                }}
                className="bg-black text-white px-4 py-2 rounded-md text-sm w-full"
              >
                Request to Join
              </button>
            </div>
          ) : null}

          {!myTeam && mode === "create" ? (
            <div>
              <input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                className="border border-neutral-300 rounded-md px-3 py-2 text-sm text-black mb-3 w-full"
              />

              <button
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void createTeam();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full"
              >
                Create Team
              </button>
            </div>
          ) : null}

          {!myTeam && mode === "join" ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  placeholder="Enter team code"
                  className="border border-neutral-300 rounded-md px-3 py-2 text-sm text-black flex-1"
                />

                <button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void requestToJoinTeam();
                  }}
                  disabled={selectedTeamIsFull || selectedTeamIsPending}
                  className={`px-4 py-2 rounded-md text-sm ${
                    selectedTeamIsFull || selectedTeamIsPending
                      ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                      : "bg-black text-white"
                  }`}
                >
                  Request
                </button>
              </div>

              {selectedTeamIsFull ? (
                <p className="text-xs text-red-600">This team is already full.</p>
              ) : null}

              {selectedTeamIsPending ? (
                <p className="text-xs text-amber-700">
                  You already have a pending request for this team.
                </p>
              ) : null}
            </div>
          ) : null}

          {myTeam ? (
            <div className="bg-white border border-blue-600 rounded-xl p-4 text-sm mt-4">
              <div className="font-semibold text-black mb-1">
                Team Code: <span className="text-blue-700">{myTeam.code}</span>
              </div>

              <div className="text-black">
                Members ({myTeam.members.length}/{maxTeamSize})
              </div>

              {myTeam.members.length >= minTeamSize ? (
                <div className="mt-2 font-medium text-green-700">Team Ready</div>
              ) : null}
            </div>
          ) : null}

          {createdTeam ? (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
              <p className="font-semibold text-green-900">Team Created</p>
              <p className="mt-1 text-green-800">
                Code: <span className="font-bold">{createdTeam.teamCode}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void copyTeamCode();
                  }}
                  className="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
                >
                  Copy Code
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    router.push(`/teams/${createdTeam.teamId}`);
                  }}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-white transition hover:bg-black"
                >
                  Go to Team
                </button>
              </div>

              {copyMessage ? (
                <p className="mt-2 text-xs font-medium text-green-700">{copyMessage}</p>
              ) : null}
            </div>
          ) : null}

          {myTeam ? (
            <button
              onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                const teamId = myTeam.id;

                await fetch(`/api/teams/${teamId}/leave`, {
                  method: "POST",
                });

                setMyTeam(null);
                loadTeams();
                router.refresh();
              }}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Leave Team
            </button>
          ) : null}

          {myTeam && currentUserId === myTeam.leaderId ? (
            <div className="mt-4">
              <p className="text-sm font-semibold text-black mb-2">
                Transfer Leadership
              </p>

              {myTeam.members
                .filter((member) => member.userId !== myTeam.leaderId)
                .map((member) => (
                  <button
                    key={member.userId}
                    onClick={async (event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      await fetch(`/api/teams/${myTeam.id}/transfer`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          newLeaderId: member.userId,
                        }),
                      });

                      loadTeams();
                      router.refresh();
                    }}
                    className="block w-full text-left bg-neutral-200 hover:bg-neutral-300 text-black px-3 py-2 rounded-md text-sm mb-2"
                  >
                    Make {member.userId} Leader
                  </button>
                ))}
            </div>
          ) : null}

          {message ? <div className="text-sm text-black mt-3">{message}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
