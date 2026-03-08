"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EventCardProps = {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  minTeamSize: number;
  maxTeamSize: number;
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
    useState<"NOT_INTERESTED" | "INTERESTED" | "CONFIRMED">(
      "NOT_INTERESTED"
    );

  const [teams, setTeams] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [joinCode, setJoinCode] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

useEffect(() => {
  fetch("/api/auth/session")
    .then((res) => res.json())
    .then((data) => {
      setCurrentUserId(data?.user?.id || null);
    });
}, []);
  
  /* ---------------- FETCH USER SKILLS ---------------- */
  useEffect(() => {
    fetch(`/api/users/skills`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setSkills(
            data.userSkills.map(
              (us: any) => us.skill.name
            )
          );
        }
      });
  }, []);

  /* ---------------- FETCH PARTICIPATION ---------------- */
  useEffect(() => {
    fetch(`/api/users/participations`)
      .then((res) => res.json())
      .then((data) => {
  if (!Array.isArray(data)) return;

  const existing = data.find(
    (p: any) => p.eventId === id
  );

  if (existing) setStatus(existing.status);
});
    loadTeams();
  }, [id]);

  const loadTeams = async () => {
    const res = await fetch(`/api/events/${id}/teams`);
    const data = await res.json();
    setTeams(data);

    const sessionRes = await fetch("/api/auth/session");
const sessionData = await sessionRes.json();

const currentUserId = sessionData?.user?.id;

const mine = data.find((team: any) =>
  team.members.some(
    (m: any) => m.userId === currentUserId
  )
);
    setMyTeam(mine || null);
  };

  /* ---------------- READINESS LOGIC ---------------- */

  const matchedSkills = requiredSkills.filter(
    (req) =>
      skills
        .map((s) => s.toLowerCase())
        .includes(req.toLowerCase())
  );

  const hasRequiredSkills = requiredSkills.length > 0;

 let readinessPercentage = 0;

if (requiredSkills.length === 0) {
  // No skills required → fully ready
  readinessPercentage = 100;
} else if (skills.length === 0) {
  readinessPercentage = 0;
} else {
  readinessPercentage = Math.round(
    (matchedSkills.length / requiredSkills.length) * 100
  );
}

  /* ---------------- CONFIRM PARTICIPATION ---------------- */

  const confirmParticipation = async () => {
    await fetch(`/api/users/participations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: id }),
    });

    setStatus("CONFIRMED");
    router.refresh(); 
  };

  /* ---------------- CREATE TEAM ---------------- */

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
} else {
  setMyTeam(data);
  setMode(null);          // 🔥 reset mode
  setMessage("Team created successfully!");
  loadTeams();
  router.refresh(); 
}
  };

  /* ---------------- JOIN TEAM ---------------- */

  const joinTeam = async () => {
    const res = await fetch("/api/teams/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: joinCode }),
    });

    const data = await res.json();

    if (data.error) {
      setMessage(data.error);
    } else {
      setMode(null);            // 🔥 reset mode
setMessage("Joined successfully!");
loadTeams();
router.refresh(); 
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-2 text-black">
        {title}
      </h3>

      <p className="text-black mb-3">
        {description}
      </p>

      {/* Required Skills */}
      <div className="mb-3">
        <p className="text-sm font-semibold text-black mb-1">
          Required Skills:
        </p>

        <div className="flex flex-wrap gap-2">
          {requiredSkills.map((skill) => {
            const matched =
              skills
                .map((s) => s.toLowerCase())
                .includes(skill.toLowerCase());

            return (
              <span
                key={skill}
                className={`px-3 py-1 rounded-full text-sm ${
                  matched
                    ? "bg-green-200 text-black"
                    : "bg-red-200 text-black"
                }`}
              >
                {skill}
              </span>
            );
          })}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-black">
          Skill Match:{" "}
          {!hasRequiredSkills
            ? "N/A"
            : `${readinessPercentage}%`}
        </p>

        {hasRequiredSkills && (
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
        )}
      </div>

      {/* Flow */}
      {status === "NOT_INTERESTED" && (
        <button
          onClick={() => setStatus("INTERESTED")}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm"
        >
          Register Interest
        </button>
      )}

      {status === "INTERESTED" && (
        <button
          onClick={confirmParticipation}
          disabled={readinessPercentage < 50}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Confirm Participation
        </button>
      )}

     {status === "CONFIRMED" && (
  <div className="mt-4 border-t border-neutral-200 pt-4">
    <h4 className="text-sm font-semibold text-black mb-3">
      Team Formation
    </h4>

    {!myTeam && !mode && (
      <div className="flex gap-3 mb-3">
        <button
          onClick={() => setMode("create")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full"
        >
          Create New Team
        </button>

        <button
          onClick={() => setMode("join")}
          className="bg-black text-white px-4 py-2 rounded-md text-sm w-full"
        >
          Join Existing Team
        </button>
      </div>
    )}

    {!myTeam && mode === "create" && (
      <div>
        <input
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm text-black mb-3 w-full"
        />

        <button
          onClick={createTeam}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm w-full"
        >
          Create Team
        </button>
      </div>
    )}

    {!myTeam && mode === "join" && (
      <div className="flex gap-2">
        <input
          value={joinCode}
          onChange={(e) =>
            setJoinCode(e.target.value.toUpperCase())
          }
          placeholder="Enter team code"
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm text-black flex-1"
        />

        <button
          onClick={joinTeam}
          className="bg-black text-white px-4 py-2 rounded-md text-sm"
        >
          Join
        </button>
      </div>
    )}

    {myTeam && (
      <div className="bg-white border border-blue-600 rounded-xl p-4 text-sm mt-4">
        <div className="font-semibold text-black mb-1">
          Team Code:{" "}
          <span className="text-blue-700">
            {myTeam.code}
          </span>
        </div>

        <div className="text-black">
          Members ({myTeam.members.length}/{maxTeamSize})
        </div>

        {myTeam.members.length >= minTeamSize && (
          <div className="mt-2 font-medium text-green-700">
            Team Ready ✅
          </div>
        )}
      </div>
    )}
   <button
  onClick={async () => {
    if (!myTeam) return;

    const teamId = myTeam.id; // ✅ capture before state changes

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
{myTeam && currentUserId === myTeam.leaderId && (
  <div className="mt-4">
    <p className="text-sm font-semibold text-black mb-2">
      Transfer Leadership
    </p>

    {myTeam.members
      .filter((m: any) => m.userId !== myTeam.leaderId)
      .map((member: any) => (
        <button
          key={member.userId}
          onClick={async () => {
            await fetch(
              `/api/teams/${myTeam.id}/transfer`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  newLeaderId: member.userId,
                }),
              }
            );

            loadTeams();
            router.refresh(); 
          }}
          className="block w-full text-left bg-neutral-200 hover:bg-neutral-300 text-black px-3 py-2 rounded-md text-sm mb-2"
        >
          Make {member.userId} Leader
        </button>
      ))}
  </div>
)}

    {message && (
      <div className="text-sm text-black mt-3">
        {message}
      </div>
    )}
  </div>
)}
    </div>
  );
} 