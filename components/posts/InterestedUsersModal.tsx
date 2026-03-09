"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Skill = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  department: string;
  division: string;
  year: number;
  linkedinUrl?: string;
  matchScore: number;
  skills: Skill[];
};

export default function InterestedUsersModal({
  postId,
  open,
  onClose,
}: {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    setLoading(true);

    fetch(`/api/posts/${postId}/interested-users`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      });
  }, [postId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Interested Candidates
              </h2>

              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <p className="text-neutral-500">Loading...</p>
            ) : users.length === 0 ? (
              <p className="text-neutral-500">
                No one has shown interest yet.
              </p>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>

                      <p className="text-sm text-neutral-500">
                        {user.department} • Year {user.year}
                      </p>

                      {/* MATCH SCORE */}
                      <p className="text-sm font-medium text-purple-600 mt-1">
                        Match: {user.matchScore}%
                      </p>

                      {/* SKILLS */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {user.linkedinUrl && (
                      <a
                        href={user.linkedinUrl}
                        target="_blank"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}