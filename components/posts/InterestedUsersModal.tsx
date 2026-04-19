"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import ProfilePanel from "@/components/profile/ProfilePanel";

type Skill = {
  id: string;
  name: string;
};

type User = {
  id: string;
  name: string;
  email?: string;
  department: string;
  division: string;
  year: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (!postId) return;

    let cancelled = false;

    const loadInterestedUsers = async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/posts/${postId}/interested-users`);
        const data = await res.json();

        if (!cancelled) {
          setUsers(data.users || []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadInterestedUsers();

    return () => {
      cancelled = true;
    };
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
                    key={user.id || user.email}
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
                            key={`${user.id || user.email}-${skill.id || skill.name}`}
                            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {user.linkedinUrl && (
                      <div className="flex flex-col items-end gap-2">
                        <a
                          href={user.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-purple-600 hover:underline"
                        >
                          LinkedIn
                        </a>

                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="text-sm px-3 py-2 rounded-lg bg-neutral-900 text-white hover:bg-black transition"
                        >
                          View Profile
                        </button>
                      </div>
                    )}

                    {!user.linkedinUrl && (
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="text-sm px-3 py-2 rounded-lg bg-neutral-900 text-white hover:bg-black transition"
                      >
                        View Profile
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      <ProfilePanel
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        userId={selectedUser?.id}
        currentUserId={session?.user?.id}
        name={selectedUser?.name}
        email={selectedUser?.email}
        isEditable={false}
      />
    </AnimatePresence>
  );
}
