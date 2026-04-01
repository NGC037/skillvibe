"use client";

import { useState } from "react";
import ProfilePanel from "@/components/profile/ProfilePanel";
import SkillEndorsementModal from "@/components/mentor/SkillEndorsementModal";

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
    level?: string;
    endorsed?: boolean;
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
  const [endorseMentee, setEndorseMentee] = useState<Mentee | null>(null);

  if (mentees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-sm text-neutral-500">
        No mentees assigned yet.
      </div>
    );
  }

  const handleEndorse = async (skillIds: string[]) => {
    if (!endorseMentee) return;

    try {
      const response = await fetch("/api/mentor/endorse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: endorseMentee.id,
          skillIds: skillIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to endorse skills");
      }

      // Update UI - refresh mentee data
      setEndorseMentee(null);
      // In a real app, you'd refetch or update local state here
    } catch (error) {
      console.error("Endorsement error:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to endorse"}`,
      );
    }
  };

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
                    className={`rounded-full px-3 py-1 text-xs ${
                      skill.endorsed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-neutral-900 text-white"
                    }`}
                  >
                    {skill.name}
                    {skill.endorsed && " ✓"}
                  </span>
                ))
              ) : (
                <span className="text-sm text-neutral-500">
                  No skills added yet.
                </span>
              )}
            </div>

            {mentee.skills.length > 0 && (
              <button
                type="button"
                onClick={() => setEndorseMentee(mentee)}
                className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
              >
                Endorse Skills
              </button>
            )}
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

      <SkillEndorsementModal
        open={Boolean(endorseMentee)}
        onClose={() => setEndorseMentee(null)}
        mentee={endorseMentee || { id: "", name: "", skills: [] }}
        onSubmit={handleEndorse}
      />
    </>
  );
}
