"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import EventCard from "@/components/events/EventCard";
import MotionWrapper from "@/components/ui/MotionWrapper";

type EventType = {
  id: string;
  title: string;
  description: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  requiredSkills: string[];
};

export default function EventsPage() {

  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {

    try {

      setError(null);

      const res = await fetch("/api/events");

      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await res.json();

      setEvents(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error(err);
      setError("Failed to load events.");

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {
    fetchEvents();
  }, []);

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {

    return (

      <AppLayout>

        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

          <MotionWrapper>

            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-10 shadow-lg">

              <h1 className="text-3xl font-bold">
                Explore Events
              </h1>

              <p className="text-white/90 mt-2">
                Discover competitions and hackathons aligned with your skills.
              </p>

            </div>

          </MotionWrapper>

          {/* Skeleton grid */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {[1,2,3].map((i) => (

              <div
                key={i}
                className="bg-white border border-neutral-200 rounded-xl p-6 animate-pulse h-48"
              />

            ))}

          </div>

        </div>

      </AppLayout>

    );

  }

  /* =========================
     ERROR STATE
  ========================= */

  if (error) {

    return (

      <AppLayout>

        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">

          <div className="bg-red-50 border border-red-200 rounded-xl p-6">

            <p className="text-red-600 font-medium">
              {error}
            </p>

            <button
              onClick={() => {
                setLoading(true);
                fetchEvents();
              }}
              className="mt-3 text-sm text-red-600 underline"
            >
              Try again
            </button>

          </div>

        </div>

      </AppLayout>

    );

  }

  /* =========================
     MAIN UI
  ========================= */

  return (

    <AppLayout>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* HERO */}

        <MotionWrapper>

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-10 shadow-lg">

            <h1 className="text-3xl font-bold">
              Explore Events
            </h1>

            <p className="text-white/90 mt-2">
              Join competitions that match your skills and collaborate with strong teams.
            </p>

          </div>

        </MotionWrapper>


        {/* EVENT COUNT */}

        <MotionWrapper>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">

              <p className="text-sm text-neutral-500">
                Available Events
              </p>

              <p className="text-3xl font-bold mt-2 text-indigo-600">
                {events.length}
              </p>

            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">

              <p className="text-sm text-neutral-500">
                Minimum Team Size Range
              </p>

              <p className="text-3xl font-bold mt-2">
                {events.length > 0
                  ? Math.min(...events.map(e => e.minTeamSize))
                  : 0}
              </p>

            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">

              <p className="text-sm text-neutral-500">
                Maximum Team Size Range
              </p>

              <p className="text-3xl font-bold mt-2">
                {events.length > 0
                  ? Math.max(...events.map(e => e.maxTeamSize))
                  : 0}
              </p>

            </div>

          </div>

        </MotionWrapper>


        {/* EVENTS GRID */}

        {events.length === 0 ? (

          <MotionWrapper>

            <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">

              <p className="text-neutral-600 text-lg">
                No events available right now.
              </p>

              <p className="text-neutral-400 text-sm mt-2">
                Check back later for new competitions.
              </p>

            </div>

          </MotionWrapper>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

            {events.map((evt) => (

              <MotionWrapper key={evt.id}>

                <div className="hover:-translate-y-1 transition-transform duration-200">

                  <EventCard
                    id={evt.id}
                    title={evt.title}
                    description={evt.description ?? ""}
                    requiredSkills={evt.requiredSkills || []}
                    minTeamSize={evt.minTeamSize}
                    maxTeamSize={evt.maxTeamSize}
                  />

                </div>

              </MotionWrapper>

            ))}

          </div>

        )}

      </div>

    </AppLayout>

  );

}