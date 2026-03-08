"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";

type SkillLevel = "Beginner" | "Intermediate" | "Advanced";



export default function SkillSelector() {
  const { data: session, status } = useSession();
  const [skills, setSkills] = useState<
    { id: string; name: string; level: SkillLevel }[]
  >([]);
  const [input, setInput] = useState("");
  const [level, setLevel] = useState<SkillLevel>("Beginner");

  // 🔵 Fetch skills on mount
  useEffect(() => {
  if (status !== "authenticated") return;

  fetch(`/api/users/skills`)
    .then((res) => res.json())
    .then((data) => {
      if (data?.success) {
        const formatted = data.userSkills.map((us: any) => ({
          id: us.skill.id,
          name: us.skill.name,
          level: us.level,
        }));
        setSkills(formatted);
      }
    })
    .catch((error) => {
      console.error("Skill fetch error:", error);
    });
}, [status]);



  const addSkill = async () => {
    if (!input.trim()) return;

    const res = await fetch(
      `/api/users//skills`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skillName: input.trim(),
          level,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      // Refetch to stay clean
      const updated = await fetch(
        `/api/users/skills`
      ).then((r) => r.json());

      if (updated.success) {
        const formatted = updated.userSkills.map((us: any) => ({
          id: us.skill.id,
          name: us.skill.name,
          level: us.level,
        }));
        setSkills(formatted);
      }

      setInput("");
    }
  };

  const removeSkill = async (skillId: string) => {
  await fetch(`/api/users/skills`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ skillId }),
  });

  // Refetch from DB
  const updated = await fetch(
    `/api/users/skills`
  ).then((r) => r.json());

  if (updated.success) {
    const formatted = updated.userSkills.map((us: any) => ({
      id: us.skill.id,
      name: us.skill.name,
      level: us.level,
    }));
    setSkills(formatted);
  }
};


  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="w-full max-w-xl">
      <label className="block text-sm font-semibold text-black mb-2">
        Add Your Skills
      </label>

      {/* Skill Display */}
      <div className="border border-black/20 rounded-lg p-3 bg-white flex flex-wrap gap-2 mb-4">
        {skills.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-2 bg-blue-200 text-black px-3 py-1 rounded-full text-sm"
          >
            {skill.name} ({skill.level})
            <button
              onClick={() => removeSkill(skill.id)}
              aria-label={`Remove ${skill.name}`}
              className="hover:text-red-600"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-3">
        <input
          type="text"
          placeholder="Type a skill..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-black/30 rounded-md px-3 py-2 text-black"
        />

        <label
  htmlFor="skill-level"
  className="sr-only"
>
  Skill Level
</label>

<select
  id="skill-level"
  value={level}
  onChange={(e) =>
    setLevel(e.target.value as SkillLevel)
  }
  className="border border-black/30 rounded-md px-3 py-2 text-black"
>

          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <button
        onClick={addSkill}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Add Skill
      </button>
    </div>
  );
}
