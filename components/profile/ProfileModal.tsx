"use client";

import { motion, AnimatePresence } from "framer-motion";

type Skill = {
  id: string;
  name: string;
};

type User = {
  name: string;
  department: string;
  division: string;
  year: number;
  linkedinUrl?: string;
  skills: Skill[];
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
  if (!user) return null;

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
            className="bg-white rounded-xl p-6 w-full max-w-md space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Profile</h2>

              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Basic Info */}

            <div className="space-y-1">
              <p className="font-medium text-lg">{user.name}</p>

              <p className="text-sm text-neutral-500">
                {user.department} • Division {user.division}
              </p>

              <p className="text-sm text-neutral-500">
                Year {user.year}
              </p>
            </div>

           {/* Skills */}

<div>
  <p className="text-sm font-medium mb-2">Skills</p>

  <div className="flex flex-wrap gap-2">
    {user.skills?.map((skill) => (
      <span
        key={skill.id}
        className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700"
      >
        {skill.name}
      </span>
    ))}

    {!user.skills?.length && (
      <span className="text-sm text-neutral-500">
        No skills listed
      </span>
    )}
  </div>
</div>

            {/* LinkedIn */}

            {user.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                className="block text-sm text-purple-600 hover:underline"
              >
                View LinkedIn Profile
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}