"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TeamCard = {
  id: string;
  isLocked: boolean;
  event: {
    title: string;
  };
  members: Array<{ id: string }>;
};

type ProjectMap = Record<string, boolean | undefined>;

interface TeamsWorkspaceGridProps {
  teams: TeamCard[];
}

export default function TeamsWorkspaceGrid({
  teams,
}: TeamsWorkspaceGridProps) {
  const router = useRouter();
  const [projectMap, setProjectMap] = useState<ProjectMap>({});

  const teamIds = useMemo(() => teams.map((team) => team.id).join(","), [teams]);

  useEffect(() => {
    const fetchProjects = async () => {
      const entries = await Promise.all(
        teams.map(async (team) => {
          try {
            const res = await fetch(
              `/api/project/get-project-by-team?teamId=${team.id}`,
            );

            if (!res.ok) {
              return [team.id, false] as const;
            }

            const data = await res.json();
            return [team.id, Boolean(data?.id)] as const;
          } catch (error) {
            console.error("Workspace project fetch error:", error);
            return [team.id, false] as const;
          }
        }),
      );

      setProjectMap(Object.fromEntries(entries));
    };

    if (teams.length > 0) {
      void fetchProjects();
    }
  }, [teamIds, teams]);

  if (teams.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8">
        <p className="text-neutral-600">You are not part of any team yet.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {teams.map((team) => {
        const hasProject = projectMap[team.id];

        return (
          <div
            key={team.id}
            onClick={() => router.push(`/teams/${team.id}`)}
            className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/teams/${team.id}`);
              }
            }}
          >
            <h2 className="text-lg font-semibold">{team.event.title}</h2>

            <p className="text-sm text-neutral-500 mt-1">
              Team ID: {team.id.slice(0, 8)}
            </p>

            <p className="text-sm text-neutral-500 mt-2">
              Members: {team.members.length}
            </p>

            {team.isLocked ? (
              <span className="inline-block mt-3 text-xs bg-neutral-900 text-white px-3 py-1 rounded-full">
                LOCKED
              </span>
            ) : (
              <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                ACTIVE
              </span>
            )}

            <div className="mt-5" onClick={(event) => event.stopPropagation()}>
              {team.isLocked ? (
                typeof hasProject === "undefined" ? (
                  <div className="animate-pulse px-4 py-2 rounded-lg bg-white/70 border border-neutral-200">
                    <div className="h-5 w-32 rounded-full bg-neutral-200" />
                  </div>
                ) : hasProject ? (
                  <button
                    onClick={() =>
                      router.push(`/dashboard/team/${team.id}/workspace`)
                    }
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                  >
                    Open Workspace
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      router.push(`/dashboard/team/${team.id}/workspace`)
                    }
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-teal-400 text-white rounded-lg font-medium hover:shadow-md transition"
                  >
                    Start Workspace
                  </button>
                )
              ) : (
                <p className="text-gray-400 text-sm">
                  Lock team to enable workspace
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
