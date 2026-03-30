"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Skill = {
  id: string;
  name: string;
};

export default function CreatePostModal({
  open,
  onClose,
  onPostCreated,
}: {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => setSkills(data.skills || []));
  }, []);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleAddSkill = () => {
    const normalizedQuery = skillQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return;
    }

    const matchedSkill = skills.find(
      (skill) => skill.name.toLowerCase() === normalizedQuery,
    );

    if (matchedSkill && !selectedSkills.includes(matchedSkill.id)) {
      setSelectedSkills((prev) => [...prev, matchedSkill.id]);
    }

    setSkillQuery("");
  };

  const createPost = async () => {
    setLoading(true);

    await fetch("/api/posts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        skillIds: selectedSkills,
      }),
    });

    setLoading(false);
    onPostCreated();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4"
          >
            <h2 className="text-lg font-semibold">
              Create Skill Request
            </h2>

            <input
              type="text"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <textarea
              placeholder="Describe what you're building..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg p-2"
            />

            <div>
              <p className="text-sm font-medium mb-2">
                Required Skills
              </p>

              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Type an existing skill and press Add"
                  className="w-full border rounded-lg p-2"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-lg bg-neutral-900 text-white"
                >
                  Add
                </button>
              </div>

              {selectedSkills.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedSkills.map((skillId) => {
                    const selectedSkill = skills.find((skill) => skill.id === skillId);

                    return (
                      <button
                        key={skillId}
                        type="button"
                        onClick={() => toggleSkill(skillId)}
                        className="px-3 py-1 rounded-full text-sm bg-purple-600 text-white"
                      >
                        {selectedSkill?.name ?? "Selected skill"} x
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    onClick={() => toggleSkill(skill.id)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedSkills.includes(skill.id)
                        ? "bg-purple-600 text-white"
                        : "bg-neutral-200"
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>

              <button
                onClick={createPost}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
