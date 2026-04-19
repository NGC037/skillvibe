"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, BarChart3, Briefcase, ExternalLink, LayoutGrid } from "lucide-react";
import AdminWorkspacesDashboard from "@/components/admin/AdminWorkspacesDashboard";
import type { MentorMenteeDetails } from "@/lib/mentor-types";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "events", label: "Events", icon: Award },
  { id: "workspace", label: "Workspace", icon: Briefcase },
  { id: "performance", label: "Performance", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function MenteeDetailTabs({
  details,
}: {
  details: MentorMenteeDetails;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const topContribution = useMemo(
    () => details.contributions[0] ?? null,
    [details.contributions],
  );

  return (
    <div className="space-y-6">
      <div className="surface-card p-3">
        <div className="grid gap-2 md:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-neutral-900 text-white shadow-sm"
                    : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Contribution Score" value={`${details.overview.contributionScore}`} />
            <StatCard label="Total Events" value={`${details.overview.totalEvents}`} />
            <StatCard label="Wins Count" value={`${details.overview.winsCount}`} />
            <StatCard label="Activity Level" value={details.overview.activityLevel} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-card p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Profile Summary</h2>
              <p className="mt-4 text-sm leading-6 text-neutral-600">
                {details.mentee.bio || "No bio added yet."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <MetaPill label={details.mentee.department || "Department not set"} />
                <MetaPill
                  label={
                    details.mentee.year ? `Year ${details.mentee.year}` : "Year not set"
                  }
                />
                <MetaPill label={details.mentee.division || "Division not set"} />
              </div>

              <div className="mt-6">
                <p className="text-sm font-medium text-neutral-800">Skill stack</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {details.mentee.skills.length > 0 ? (
                    details.mentee.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className={`rounded-full px-3 py-1 text-xs ${
                          skill.endorsed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-neutral-900 text-white"
                        }`}
                      >
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-neutral-500">No skills added yet.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Proof Vault</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Links and references currently available for this mentee.
              </p>

              <div className="mt-5 space-y-3">
                {details.proofs.length > 0 ? (
                  details.proofs.map((proof) => (
                    <Link
                      key={proof.id}
                      href={proof.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-indigo-300 hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900">{proof.title}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-neutral-500">
                            {proof.source}
                          </p>
                        </div>
                        <ExternalLink className="mt-0.5 h-4 w-4 text-neutral-400" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <EmptyState message="No proofs have been added yet." />
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Recent Wins</h2>
              <div className="mt-4 space-y-3">
                {details.wins.length > 0 ? (
                  details.wins.map((event) => (
                    <EventItem key={event.id} event={event} />
                  ))
                ) : (
                  <EmptyState message="No win records available yet." />
                )}
              </div>
            </div>

            <div className="surface-card p-6">
              <h2 className="text-xl font-semibold text-neutral-900">Contribution Snapshot</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  label="Tasks Completed"
                  value={`${details.overview.tasksCompleted}`}
                />
                <MiniMetric label="Logs Created" value={`${details.overview.logsCreated}`} />
                <MiniMetric label="Proof Entries" value={`${details.overview.proofCount}`} />
                <MiniMetric
                  label="Top Workspace"
                  value={topContribution?.teamName || "No workspace yet"}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "events" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Won Events</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Top-ranked event workspaces are marked here when explicit award data is not stored yet.
            </p>
            <div className="mt-5 space-y-3">
              {details.wins.length > 0 ? (
                details.wins.map((event) => <EventItem key={event.id} event={event} />)
              ) : (
                <EmptyState message="No won events available yet." />
              )}
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Participated Events</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Full event history for this mentee, including workspace completion and proof coverage.
            </p>
            <div className="mt-5 space-y-3">
              {details.events.length > 0 ? (
                details.events.map((event) => <EventItem key={event.id} event={event} />)
              ) : (
                <EmptyState message="No event participation history found." />
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "workspace" ? (
        <div className="surface-card overflow-hidden bg-slate-950 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Workspace Board</h2>
            <p className="mt-2 text-sm text-slate-300">
              Read-only workspace analytics filtered to this mentee.
            </p>
          </div>

          <AdminWorkspacesDashboard
            teams={details.workspaces}
            showHero={false}
            title="Workspace Board"
            description="Read-only workspace analytics filtered to this mentee."
          />
        </div>
      ) : null}

      {activeTab === "performance" ? (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Contribution Stats</h2>
            <div className="mt-5 space-y-3">
              {details.contributions.length > 0 ? (
                details.contributions.map((contribution) => (
                  <div
                    key={contribution.projectId}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {contribution.projectTitle}
                        </p>
                        <p className="mt-1 text-sm text-neutral-500">
                          {contribution.teamName}
                        </p>
                      </div>
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                        {contribution.score} pts
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <MiniMetric
                        label="Tasks Completed"
                        value={`${contribution.tasksCompleted}`}
                      />
                      <MiniMetric label="Logs Created" value={`${contribution.logsCreated}`} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No contribution stats available yet." />
              )}
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-neutral-900">Activity Log</h2>
            <div className="mt-5 space-y-3">
              {details.logs.length > 0 ? (
                details.logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">{log.projectTitle}</p>
                        <p className="mt-1 text-sm text-neutral-500">{log.teamName}</p>
                      </div>
                      <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-neutral-700">{log.content}</p>
                  </div>
                ))
              ) : (
                <EmptyState message="No activity logs found yet." />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
      {label}
    </span>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function EventItem({
  event,
}: {
  event: MentorMenteeDetails["events"][number];
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-neutral-900">{event.title}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {event.teamName || "No team linked"} | {formatDate(event.participatedAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            event.isWinner
              ? "bg-amber-100 text-amber-700"
              : "bg-indigo-100 text-indigo-700"
          }`}
        >
          {event.isWinner ? "Winner" : event.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Workspace Completion" value={`${event.workspaceCompletion}%`} />
        <MiniMetric label="Proofs" value={`${event.proofCount}`} />
        <MiniMetric
          label="Win Signal"
          value={event.winLabel || "Not available"}
        />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-center text-sm text-neutral-500">
      {message}
    </div>
  );
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}
