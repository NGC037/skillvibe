"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import MotionWrapper from "@/components/ui/MotionWrapper";

type EventTimelineStatus = "ONGOING" | "UPCOMING" | "PAST";

type EventType = {
  id: string;
  title: string;
  description: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  posterUrl: string | null;
  externalLink: string | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  requiredSkills: string[];
  timelineStatus: EventTimelineStatus;
};

type EventsResponse = {
  events?: EventType[];
};

const sectionMeta: Record<
  EventTimelineStatus,
  {
    title: string;
    empty: string;
  }
> = {
  ONGOING: {
    title: "🔥 Ongoing Events",
    empty: "No ongoing events right now.",
  },
  UPCOMING: {
    title: "⏳ Upcoming Events",
    empty: "No upcoming events announced yet.",
  },
  PAST: {
    title: "📁 Past Events",
    empty: "No past events available yet.",
  },
};

export default function EventsPage() {
  const router = useRouter();
  const [ongoingEvents, setOngoingEvents] = useState<EventType[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventType[]>([]);
  const [pastEvents, setPastEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setError(null);

        const [ongoingRes, upcomingRes, pastRes] = await Promise.all([
          fetch("/api/events?status=ONGOING"),
          fetch("/api/events?status=UPCOMING"),
          fetch("/api/events?status=PAST"),
        ]);

        if (!ongoingRes.ok || !upcomingRes.ok || !pastRes.ok) {
          throw new Error("Failed to fetch events");
        }

        const [ongoingData, upcomingData, pastData]: [
          EventsResponse,
          EventsResponse,
          EventsResponse,
        ] = await Promise.all([
          ongoingRes.json(),
          upcomingRes.json(),
          pastRes.json(),
        ]);

        setOngoingEvents(Array.isArray(ongoingData.events) ? ongoingData.events : []);
        setUpcomingEvents(Array.isArray(upcomingData.events) ? upcomingData.events : []);
        setPastEvents(Array.isArray(pastData.events) ? pastData.events : []);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Failed to load events.");
      } finally {
        setLoading(false);
      }
    }

    void fetchEvents();
  }, []);

  const handleOpenEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-10">
          <MotionWrapper>
            <div className="surface-card-strong overflow-hidden p-10">
              <div className="shimmer-skeleton h-8 w-56 rounded-full" />
              <div className="shimmer-skeleton mt-4 h-4 w-96 rounded-full" />
            </div>
          </MotionWrapper>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="surface-card h-[24rem] animate-pulse overflow-hidden"
              />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-10">
        <MotionWrapper>
          <div className="surface-card-strong overflow-hidden p-10">
            <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">
              Explore Events
            </h1>
            <p className="mt-3 max-w-3xl text-base text-neutral-600">
              Discover competitions, track upcoming opportunities, and revisit past
              events across SkillVibe.
            </p>
          </div>
        </MotionWrapper>

        <EventsSection
          title={sectionMeta.ONGOING.title}
          emptyMessage={sectionMeta.ONGOING.empty}
          events={ongoingEvents}
          onOpenEvent={handleOpenEvent}
        />

        <EventsSection
          title={sectionMeta.UPCOMING.title}
          emptyMessage={sectionMeta.UPCOMING.empty}
          events={upcomingEvents}
          onOpenEvent={handleOpenEvent}
        />

        <EventsSection
          title={sectionMeta.PAST.title}
          emptyMessage={sectionMeta.PAST.empty}
          events={pastEvents}
          onOpenEvent={handleOpenEvent}
        />
      </div>
    </AppLayout>
  );
}

function EventsSection({
  title,
  emptyMessage,
  events,
  onOpenEvent,
}: {
  title: string;
  emptyMessage: string;
  events: EventType[];
  onOpenEvent: (eventId: string) => void;
}) {
  const handleCardKeyDown = (
    keyEvent: React.KeyboardEvent<HTMLDivElement>,
    eventId: string,
  ) => {
    if (keyEvent.key === "Enter" || keyEvent.key === " ") {
      keyEvent.preventDefault();
      onOpenEvent(eventId);
    }
  };

  return (
    <MotionWrapper>
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
          <div className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
            {events.length} events
          </div>
        </div>

        {events.length === 0 ? (
          <div className="surface-card p-10 text-center text-neutral-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenEvent(event.id)}
                onKeyDown={(keyEvent) => handleCardKeyDown(keyEvent, event.id)}
                className="surface-card interactive-card overflow-hidden text-left transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="relative">
                  {event.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.posterUrl}
                      alt={event.title}
                      className="h-40 w-full rounded-t-2xl object-cover"
                    />
                  ) : (
                    <div className="h-40 w-full rounded-t-2xl bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500" />
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="p-6">
                  <p className="text-sm font-medium text-neutral-500">
                    {formatDateRange(event.registrationStartDate, event.registrationEndDate)}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-neutral-900">
                    {event.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600">
                    {event.description || "No event description has been added yet."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MotionWrapper>
  );
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) {
    return "Dates to be announced";
  }

  const formattedStart = start
    ? new Date(start).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";
  const formattedEnd = end
    ? new Date(end).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";

  return `${formattedStart} - ${formattedEnd}`;
}
