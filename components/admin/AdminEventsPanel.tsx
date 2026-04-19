"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DeleteEventButton from "@/components/admin/DeleteEventButton";

type AdminEvent = {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  timelineStatus: "ONGOING" | "UPCOMING" | "PAST";
  analytics: {
    participantsCount: number;
    activeTeams: number;
    completionRate: number;
  };
  eventSkills: Array<{
    skill: {
      id: string;
      name: string;
    };
  }>;
};

const filters = [
  { id: "ONGOING", label: "Ongoing" },
  { id: "UPCOMING", label: "Upcoming" },
  { id: "PAST", label: "Past" },
] as const;

export default function AdminEventsPanel({ events }: { events: AdminEvent[] }) {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]["id"]>("ONGOING");

  const filteredEvents = useMemo(
    () => events.filter((event) => event.timelineStatus === activeFilter),
    [activeFilter, events],
  );

  return (
    <div className="surface-card p-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Events Command Desk</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Review ongoing, upcoming, and past events with registration window filters.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl bg-neutral-100 p-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-10 text-center text-sm text-neutral-500">
          No {activeFilter.toLowerCase()} events right now.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm"
            >
              <div className="relative h-52 bg-gradient-to-br from-slate-900 via-indigo-700 to-cyan-500">
                {event.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-end p-6 text-white">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-white/70">
                        SkillVibe event
                      </p>
                      <p className="mt-2 text-2xl font-semibold">{event.title}</p>
                    </div>
                  </div>
                )}

                <div className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  {event.timelineStatus}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="text-lg font-semibold text-neutral-900 hover:text-indigo-600"
                    >
                      {event.title}
                    </Link>
                    <p className="mt-2 text-sm text-neutral-600">
                      {event.description || "No event description added yet."}
                    </p>
                  </div>

                  <div className="text-right text-xs text-neutral-500">
                    <p>
                      Start: {formatDate(event.registrationStartDate)}
                    </p>
                    <p className="mt-1">
                      End: {formatDate(event.registrationEndDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    label="Participants"
                    value={`${event.analytics.participantsCount}`}
                  />
                  <MetricCard label="Active Teams" value={`${event.analytics.activeTeams}`} />
                  <MetricCard
                    label="Completion"
                    value={`${event.analytics.completionRate}%`}
                  />
                </div>

                {event.eventSkills.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {event.eventSkills.map((eventSkill) => (
                      <span
                        key={eventSkill.skill.id}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700"
                      >
                        {eventSkill.skill.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6 flex items-center justify-between">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white"
                  >
                    Edit Event
                  </Link>

                  <DeleteEventButton eventId={event.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-IN");
}
