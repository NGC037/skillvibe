"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Skill {
  id: string;
  name: string;
}

interface EventSkill {
  skill: Skill;
}

interface EventType {
  id: string;
  title: string;
  description: string | null;
  minTeamSize: number;
  maxTeamSize: number;
  eventSkills: EventSkill[];
}

export default function EditEventForm({
  event,
  allSkills,
}: {
  event: EventType;
  allSkills: Skill[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState<string>(event.title);
  const [description, setDescription] = useState<string>(
    event.description || ""
  );
  const [minTeamSize, setMinTeamSize] = useState<number>(
    event.minTeamSize
  );
  const [maxTeamSize, setMaxTeamSize] = useState<number>(
    event.maxTeamSize
  );

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    event.eventSkills.map((es) => es.skill.name)
  );

  function toggleSkill(skill: string) {
    setSelectedSkills((prev: string[]) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch(
      `/api/admin/events/${event.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          minTeamSize,
          maxTeamSize,
          requiredSkills: selectedSkills,
        }),
      }
    );

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      alert("Failed to update event");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">
        Edit Event
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6"
      >
        {/* TITLE */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium mb-2"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
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
            className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />
        </div>

        {/* TEAM SIZE */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="minTeamSize"
              className="block text-sm font-medium mb-2"
            >
              Min Team Size
            </label>
            <input
              id="minTeamSize"
              type="number"
              min={1}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
              value={minTeamSize}
              onChange={(e) =>
                setMinTeamSize(
                  Number(e.target.value)
                )
              }
            />
          </div>

          <div>
            <label
              htmlFor="maxTeamSize"
              className="block text-sm font-medium mb-2"
            >
              Max Team Size
            </label>
            <input
              id="maxTeamSize"
              type="number"
              min={1}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
              value={maxTeamSize}
              onChange={(e) =>
                setMaxTeamSize(
                  Number(e.target.value)
                )
              }
            />
          </div>
        </div>

        {/* SKILLS */}
        <div>
          <p className="block text-sm font-medium mb-3">
            Required Skills
          </p>

          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <button
                type="button"
                key={skill.id}
                onClick={() =>
                  toggleSkill(skill.name)
                }
                className={`px-3 py-1 text-sm rounded-full border ${
                  selectedSkills.includes(
                    skill.name
                  )
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-neutral-300 text-neutral-700"
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Update Event
        </button>
      </form>
    </div>
  );
}