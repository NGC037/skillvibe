"use client";

import { useEffect, useState } from "react";

export default function RegistrationControl({ eventId }: { eventId: string }) {
  const [externalLink, setExternalLink] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadEventDetails = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        if (!isMounted) {
          return;
        }

        setExternalLink(data.externalLink ?? "");
        setIsOpen(Boolean(data.isRegistrationOpen));
      } catch (err) {
        console.error(err);
      }
    };

    void loadEventDetails();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  const handleUpdateRegistration = async () => {
    try {
      setLoading(true);
      console.log({
        externalLink,
        isRegistrationOpen: isOpen,
      });

      const res = await fetch(`/api/admin/events/${eventId}/registration`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          externalLink,
          isRegistrationOpen: isOpen,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update");
        return;
      }

      setTimeout(() => {
        alert("Saved successfully");
      }, 100);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm mt-8 relative z-50">
      <h2 className="text-xl font-semibold mb-4">Registration Control</h2>

      {/* LINK INPUT */}
      <div className="space-y-3">
        <label className="text-sm text-neutral-600">
          External Registration Link
        </label>

        <input
          type="text"
          value={externalLink}
          onChange={(e) => setExternalLink(e.target.value)}
          placeholder="https://unstop.com/..."
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* TOGGLE SECTION */}
      <div className="flex items-center justify-between mt-6">
        <span className="text-sm text-neutral-600">Open Registration</span>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`px-4 py-2 rounded-lg text-white transition ${
            isOpen ? "bg-green-600 shadow" : "bg-gray-400"
          }`}
        >
          {isOpen ? "OPEN" : "CLOSED"}
        </button>
      </div>

      {/* SAVE BUTTON */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleUpdateRegistration}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
