"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateForInput } from "@/lib/events";

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
  registrationStartDate: Date | null;
  registrationEndDate: Date | null;
  externalLink: string | null;
  posterUrl: string | null;
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
  const [registrationStart, setRegistrationStart] = useState<string>(
    formatDateForInput(event.registrationStartDate)
  );
  const [registrationEnd, setRegistrationEnd] = useState<string>(
    formatDateForInput(event.registrationEndDate)
  );
  const [registrationLink, setRegistrationLink] = useState<string>(
    event.externalLink || ""
  );
  const [eventPoster, setEventPoster] = useState<File | null>(null);

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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("minTeamSize", String(minTeamSize));
    formData.append("maxTeamSize", String(maxTeamSize));
    formData.append("registrationStart", registrationStart);
    formData.append("registrationEnd", registrationEnd);
    formData.append("officialRegistrationLink", registrationLink);
    selectedSkills.forEach((skill) => formData.append("requiredSkills", skill));
    if (eventPoster) {
      formData.append("eventPoster", eventPoster);
    }

    const res = await fetch(
      `/api/admin/events/${event.id}`,
      {
        method: "PATCH",
        body: formData,
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="registrationStart"
              className="block text-sm font-medium mb-2"
            >
              Registration Start
            </label>
            <input
              id="registrationStart"
              type="date"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
              value={registrationStart}
              onChange={(e) =>
                setRegistrationStart(e.target.value)
              }
              required
            />
          </div>

          <div>
            <label
              htmlFor="registrationEnd"
              className="block text-sm font-medium mb-2"
            >
              Registration End
            </label>
            <input
              id="registrationEnd"
              type="date"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
              value={registrationEnd}
              onChange={(e) =>
                setRegistrationEnd(e.target.value)
              }
              required
            />
          </div>
        </div>

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
            className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
            value={registrationLink}
            onChange={(e) =>
              setRegistrationLink(e.target.value)
            }
            placeholder="https://event-registration-link.com"
          />
        </div>

        <div>
          <label
            htmlFor="eventPoster"
            className="block text-sm font-medium mb-2"
          >
            Replace Poster
          </label>

          {event.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.posterUrl}
              alt={event.title}
              className="mb-3 h-44 w-full rounded-xl object-cover border border-neutral-200"
            />
          ) : null}

          <input
            id="eventPoster"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-600 outline-none"
            onChange={(e) =>
              setEventPoster(e.target.files?.[0] ?? null)
            }
          />
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
