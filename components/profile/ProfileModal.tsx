"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Skill = {
  id: string;
  name: string;
};

type User = {
  name: string;
  department?: string;
  division?: string;
  year?: number;
  linkedinUrl?: string;
  bio?: string;
  skills?: Skill[];
};

export default function ProfileModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState<Skill[]>(user?.skills || []);

  if (!user) return null;

  const handleSave = async () => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bio,
        skills: skills.map((s) => ({
          skillId: s.id,
          level: "Intermediate", // temporary
        })),
      }),
    });

    const data = await res.json();
    console.log(data);

    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="surface-card-strong p-6 w-full max-w-md space-y-5"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Profile</h2>

              <div className="flex gap-3 items-center">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-purple-600 hover:text-indigo-700 transition"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>

                <button
                  onClick={onClose}
                  className="text-neutral-500 hover:text-black"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* BASIC INFO */}
            <div className="space-y-1">
              <p className="font-medium text-lg">{user.name}</p>

              <p className="text-sm text-neutral-500">
                {user.department} • Division {user.division}
              </p>

              <p className="text-sm text-neutral-500">Year {user.year}</p>
            </div>

            {/* BIO */}
            <div>
              <p className="text-sm font-medium mb-1">Bio</p>

              {isEditing ? (
                <div>
                  <label htmlFor="bio" className="text-sm font-medium">
                    Bio
                  </label>

                  <textarea
                    id="bio"
                    placeholder="Write something about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border border-neutral-200 bg-neutral-50 p-3 rounded-xl mt-1"
                  />
                </div>
              ) : (
                <p className="text-sm text-neutral-600 rounded-2xl bg-neutral-50 border border-neutral-100 px-4 py-3">
                  {bio || "No bio added"}
                </p>
              )}
            </div>

            {/* SKILLS */}
            <div>
              <p className="text-sm font-medium mb-2">Skills</p>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 flex items-center gap-2"
                  >
                    {skill.name}

                    {isEditing && (
                      <button
                        onClick={() =>
                          setSkills(skills.filter((_, i) => i !== index))
                        }
                        className="text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}

                {!skills.length && (
                  <span className="text-sm text-neutral-500">
                    No skills listed
                  </span>
                )}
              </div>

              {isEditing && (
                <button
                  onClick={() =>
                    setSkills([...skills, { id: "", name: "New Skill" }])
                  }
                  className="text-sm text-purple-600 mt-2"
                >
                  + Add Skill
                </button>
              )}
            </div>

            {/* LINKEDIN */}
            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                className="block text-sm text-purple-600 hover:underline"
              >
                View LinkedIn Profile
              </a>
            )}

            {/* SAVE BUTTON */}
            {isEditing && (
              <button
                onClick={handleSave}
                className="bg-black text-white px-4 py-3 rounded-xl w-full shadow-sm"
              >
                Save Changes
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
