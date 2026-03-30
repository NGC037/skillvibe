"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";

type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

export default function SkillSelector({ isEditing }: { isEditing: boolean }) {
  const { data: session, status } = useSession();

  const [skills, setSkills] = useState<
    { id: string; name: string; level: SkillLevel; endorsed?: boolean }[]
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
            endorsed: us.endorsed,
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
      `/api/users/skills`, // ✅ FIXED (removed extra slash)
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          skillName: input.trim(),
          level,
        }),
      },
    );

    const data = await res.json();

    if (data.success) {
      const updated = await fetch(`/api/users/skills`).then((r) => r.json());

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

    const updated = await fetch(`/api/users/skills`).then((r) => r.json());

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
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span
              key={skill.id}
              className="flex items-center gap-2 bg-linear-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm shadow-sm"
            >
              {skill.name}

              {/* LEVEL BADGE */}
              <span className="text-xs bg-white px-2 py-0.5 rounded shadow">
                {skill.level}
              </span>

              {/* VERIFIED BADGE */}
              {skill.endorsed && (
                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                  ✓ Verified
                </span>
              )}

              {/* REMOVE BUTTON */}
              {isEditing && (
                <button
                  onClick={() => removeSkill(skill.id)}
                  title="Remove skill"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-sm text-neutral-500">No skills added</span>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3 mb-3">
        {/* ✅ FIXED: Added label for accessibility */}
        <label htmlFor="skill-input" className="sr-only">
          Skill Input
        </label>

        <input
          disabled={!isEditing}
          id="skill-input"
          type="text"
          placeholder="Type a skill..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-black/30 rounded-md px-3 py-2 text-black"
        />

        <label htmlFor="skill-level" className="sr-only">
          Skill Level
        </label>

        <select
          disabled={!isEditing}
          id="skill-level"
          value={level}
          onChange={(e) => setLevel(e.target.value as SkillLevel)}
          className="border border-black/30 rounded-md px-3 py-2 text-black"
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      <button
        disabled={!isEditing}
        onClick={addSkill}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Add Skill
      </button>
    </div>
  );
}
