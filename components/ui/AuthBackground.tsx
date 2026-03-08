"use client";

import { motion } from "framer-motion";

export default function AuthBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">

      {/* Gradient base */}

      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500 opacity-90" />

      {/* Animated blobs */}

      <motion.div
        animate={{ y: [0, -40, 0] }}
        transition={{ repeat: Infinity, duration: 12 }}
        className="absolute w-96 h-96 bg-purple-400 rounded-full blur-3xl opacity-30 top-20 left-20"
      />

      <motion.div
        animate={{ y: [0, 40, 0] }}
        transition={{ repeat: Infinity, duration: 14 }}
        className="absolute w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-30 bottom-20 right-20"
      />

      <motion.div
        animate={{ x: [0, 40, 0] }}
        transition={{ repeat: Infinity, duration: 16 }}
        className="absolute w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-30 top-1/2 left-1/2"
      />

    </div>
  );
}