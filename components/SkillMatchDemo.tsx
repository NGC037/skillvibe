"use client";

import { motion } from "framer-motion";

export default function SkillMatchDemo() {
  const skills = [
    { name: "React", match: true },
    { name: "Node", match: true },
    { name: "MongoDB", match: false },
  ];

  const score = 66;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold mb-4">Skill Match Example</h3>

      <div className="space-y-3">
        {skills.map((skill, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span>{skill.name}</span>

            <span
              className={skill.match ? "text-green-600" : "text-neutral-400"}
            >
              {skill.match ? "Matched" : "Missing"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-sm mb-1">Match Score</div>

        <div className="w-full bg-neutral-200 rounded-full h-2">
          <motion.div
            className="bg-purple-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1 }}
          />
        </div>

        <div className="text-sm mt-2">{score}% Match</div>
      </div>
    </div>
  );
}
