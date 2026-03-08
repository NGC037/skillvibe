"use client";

import { motion } from "framer-motion";

export default function FloatingBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">

      <motion.div
        animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
        className="absolute top-10 left-10 w-96 h-96 bg-purple-500 opacity-30 rounded-full blur-3xl"
      />

      <motion.div
        animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
        transition={{ duration: 16, repeat: Infinity }}
        className="absolute bottom-10 right-10 w-[28rem] h-[28rem] bg-indigo-500 opacity-30 rounded-full blur-3xl"
      />

      <motion.div
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
        className="absolute top-1/2 left-1/3 w-[26rem] h-[26rem] bg-blue-500 opacity-30 rounded-full blur-3xl"
      />

    </div>
  );
}