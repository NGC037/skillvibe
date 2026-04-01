"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

type Skill = {
  id: string;
  name: string;
  level?: string;
  endorsed?: boolean;
};

type SkillEndorsementModalProps = {
  open: boolean;
  onClose: () => void;
  mentee: {
    id: string;
    name: string | null;
    skills: Skill[];
  };
  onSubmit: (skillIds: string[]) => Promise<void>;
};

export default function SkillEndorsementModal({
  open,
  onClose,
  mentee,
  onSubmit,
}: SkillEndorsementModalProps) {
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const toggleSkill = (skillId: string) => {
    const newSelected = new Set(selectedSkills);
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId);
    } else {
      newSelected.add(skillId);
    }
    setSelectedSkills(newSelected);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      await onSubmit(Array.from(selectedSkills));
      setSelectedSkills(new Set());
      onClose();
    } catch (error) {
      console.error("Endorsement error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unskillsCount = (mentee.skills || []).length;
  const selectedCount = selectedSkills.size;
  const endorsedCount = (mentee.skills || []).filter((s) => s.endorsed).length;
  const availableToEndorse = unskillsCount - endorsedCount;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                  Endorse Skills
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {mentee.name || "Student"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 hover:bg-neutral-100"
              >
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>

            {/* Skills List */}
            <div className="mb-6 max-h-96 space-y-3 overflow-y-auto">
              {(mentee.skills || []).length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-500">
                  No skills to endorse.
                </p>
              ) : (
                (mentee.skills || []).map((skill) => (
                  <div
                    key={skill.id}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 transition ${
                      selectedSkills.has(skill.id)
                        ? "border-indigo-500 bg-indigo-50"
                        : skill.endorsed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkills.has(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                      disabled={skill.endorsed}
                      className="h-4 w-4 rounded border-neutral-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {skill.name}
                      </p>
                      {skill.level && (
                        <p className="text-xs text-neutral-500">
                          {skill.level}
                        </p>
                      )}
                    </div>
                    {skill.endorsed && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-600">
                          Endorsed
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-3 rounded-xl bg-neutral-50 p-4 text-center">
              <div>
                <p className="text-xs text-neutral-500">Total</p>
                <p className="mt-1 text-lg font-bold text-neutral-900">
                  {unskillsCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Endorsed</p>
                <p className="mt-1 text-lg font-bold text-emerald-600">
                  {endorsedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Selected</p>
                <p className="mt-1 text-lg font-bold text-indigo-600">
                  {selectedCount}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading || selectedCount === 0}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? "Endorsing..." : `Endorse (${selectedCount})`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
