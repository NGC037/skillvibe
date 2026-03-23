"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MotionWrapper from "@/components/ui/MotionWrapper";

type Skill = {
  name: string;
};

type SkillsResponse = {
  success?: boolean;
  skills?: Skill[];
};

export default function CreateEventPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [registrationLink, setRegistrationLink] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===========================
     FETCH SKILLS
  =========================== */

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch("/api/admin/skills");
        const data: SkillsResponse = await res.json();

        if (res.ok && data.success && Array.isArray(data.skills)) {
          setSkills(data.skills.map((skill) => skill.name));
        } else {
          setSkills([]);
        }
      } catch {
        console.error("Failed to load skills");
        setSkills([]);
      }
    }

    fetchSkills();
  }, []);

  /* ===========================
     SUBMIT EVENT
  =========================== */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
        requiredSkills: selectedSkills,
        officialRegistrationLink: registrationLink,
      }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      alert("Failed to create event");
    }

    setLoading(false);
  }

  /* ===========================
     SKILL TOGGLE
  =========================== */

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* HERO */}

      <MotionWrapper>
        <div className="bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold">Create New Event</h1>

          <p className="text-white/90 mt-2">
            Define participation rules and governance requirements for this
            event.
          </p>
        </div>
      </MotionWrapper>

      {/* FORM */}

      <MotionWrapper>
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-8 shadow-sm"
        >
          {/* TITLE */}

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Event Title
            </label>

            <input
              id="title"
              type="text"
              className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description
            </label>

            <textarea
              id="description"
              rows={4}
              className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* TEAM SIZE */}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="minTeamSize"
                className="block text-sm font-medium mb-2"
              >
                Minimum Team Size
              </label>

              <input
                id="minTeamSize"
                type="number"
                min={1}
                className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={minTeamSize}
                onChange={(e) => setMinTeamSize(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label
                htmlFor="maxTeamSize"
                className="block text-sm font-medium mb-2"
              >
                Maximum Team Size
              </label>

              <input
                id="maxTeamSize"
                type="number"
                min={1}
                className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* REQUIRED SKILLS */}

          <div>
            <p className="text-sm font-medium mb-3">Required Skills</p>

            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 text-sm rounded-full border transition ${
                    selectedSkills.includes(skill)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* OFFICIAL REGISTRATION LINK */}

          <div>
            <label
              htmlFor="registrationLink"
              className="block text-sm font-medium mb-2"
            >
              Official Registration Link
            </label>

            <input
              id="registrationLink"
              type="url"
              placeholder="https://event-registration-link.com"
              className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={registrationLink}
              onChange={(e) => setRegistrationLink(e.target.value)}
            />

            <p className="text-xs text-neutral-500 mt-2">
              This link will only become visible to teams once their team is
              fully formed and locked according to event governance rules.
            </p>
          </div>

          {/* GOVERNANCE INFO */}

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm text-neutral-600">
            Teams will only receive the official registration link after:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Team meets the minimum team size requirement</li>
              <li>All members confirm participation</li>
              <li>The team is locked by the team leader</li>
            </ul>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition"
          >
            {loading ? "Creating Event..." : "Create Event"}
          </button>
        </form>
      </MotionWrapper>
    </div>
  );
}
