"use client";

import { motion } from "framer-motion";

const skills = [
  { name: "React", x: "20%", y: "30%" },
  { name: "Node", x: "60%", y: "40%" },
  { name: "AI", x: "45%", y: "20%" },
  { name: "Design", x: "30%", y: "60%" },
  { name: "MongoDB", x: "70%", y: "65%" },
];

export default function SkillNetwork() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {skills.map((skill, i) => (
        <motion.div
          key={i}
          className="absolute text-xs bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20"
          style={{
            left: skill.x,
            top: skill.y,
          }}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
          }}
        >
          {skill.name}
        </motion.div>
      ))}
    </div>
  );
}
