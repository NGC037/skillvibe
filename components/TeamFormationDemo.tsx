"use client";

import { motion } from "framer-motion";

export default function TeamFormationDemo() {
  const members = ["Frontend Dev", "Backend Dev", "AI Engineer"];

  return (
    <div className="flex items-center justify-center gap-6 mt-10">
      {members.map((member, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.3 }}
          className="bg-white border border-neutral-200 px-4 py-2 rounded-lg shadow-sm"
        >
          {member}
        </motion.div>
      ))}

      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
      >
        Team Locked
      </motion.div>
    </div>
  );
}
