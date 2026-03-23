"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";

type Status = "loading" | "not_locked" | "closed" | "ready";

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [status, setStatus] = useState<Status>("loading");
  const [loading, setLoading] = useState(false);

  /* =========================
     CHECK STATUS
  ========================= */

  useEffect(() => {
    const checkStatus = async () => {
      const res = await fetch(`/api/events/${eventId}/registration`);
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Team not locked yet") {
          setStatus("not_locked");
        } else if (data.error === "Registration not open") {
          setStatus("closed");
        } else {
          setStatus("not_locked");
        }
        return;
      }

      setStatus("ready");
    };

    checkStatus();
  }, [eventId]);

  /* =========================
     HANDLE REGISTRATION
  ========================= */

  const handleRegistration = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/events/${eventId}/registration`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      window.open(data.externalLink, "_blank");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */

  const renderContent = () => {
    if (status === "loading") {
      return <p className="text-neutral-500">Checking your team status...</p>;
    }

    if (status === "not_locked") {
      return (
        <div className="text-yellow-600 font-medium">
          ⚠️ Your team is not locked yet.
          <br />
          Please complete your team to proceed.
        </div>
      );
    }

    if (status === "closed") {
      return (
        <div className="text-blue-600 font-medium">
          ⏳ Registration is not open yet.
        </div>
      );
    }

    if (status === "ready") {
      return (
        <button
          onClick={handleRegistration}
          disabled={loading}
          className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Redirecting..." : "Proceed to Registration"}
        </button>
      );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-2xl font-semibold">Event Details</h1>

        <div className="bg-white border rounded-xl p-6 shadow-sm">
          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
}
