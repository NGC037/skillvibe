"use client";

import { useState } from "react";
import ProfilePanel from "@/components/profile/ProfilePanel";

type Mentee = {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  year: number | null;
  division: string | null;
  skills: Array<{
    id: string;
    name: string;
  }>;
};

export default function MenteeGrid({
  mentees,
  mentorId,
}: {
  mentees: Mentee[];
  mentorId: string;
}) {
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);

  if (mentees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
        No mentees assigned yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {mentees.map((mentee) => (
          <div
            key={mentee.id}
            className="interactive-card rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-neutral-900">
                  {mentee.name || "Student"}
                </p>
                <p className="mt-1 text-sm text-neutral-500">{mentee.email}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMentee(mentee)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                View Profile
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                {mentee.department || "Department not set"}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                {mentee.year ? `Year ${mentee.year}` : "Year not set"}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                {mentee.division || "Division not set"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {mentee.skills.length > 0 ? (
                mentee.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-white"
                  >
                    {skill.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-neutral-500">No skills added yet.</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <ProfilePanel
        open={Boolean(selectedMentee)}
        onClose={() => setSelectedMentee(null)}
        userId={selectedMentee?.id}
        currentUserId={mentorId}
        name={selectedMentee?.name}
        email={selectedMentee?.email}
        isEditable={false}
      />
    </>
  );
}
