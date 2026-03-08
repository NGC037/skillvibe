"use client";

import { motion } from "framer-motion";

export default function HeroDashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="relative mt-20 max-w-5xl mx-auto"
    >

      <div className="bg-white/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-8">

        <div className="grid md:grid-cols-3 gap-6">

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-neutral-50 border border-neutral-200 rounded-xl p-6"
          >
            <h4 className="text-sm text-neutral-500">Active Events</h4>
            <p className="text-3xl font-semibold mt-2">12</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-neutral-50 border border-neutral-200 rounded-xl p-6"
          >
            <h4 className="text-sm text-neutral-500">Teams Formed</h4>
            <p className="text-3xl font-semibold mt-2">48</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-neutral-50 border border-neutral-200 rounded-xl p-6"
          >
            <h4 className="text-sm text-neutral-500">Confirmed Participation</h4>
            <p className="text-3xl font-semibold mt-2">26</p>
          </motion.div>

        </div>

        {/* fake activity */}

        <div className="mt-8 border border-neutral-200 rounded-xl p-4 bg-neutral-50">

          <p className="text-sm text-neutral-600">
            Team <span className="font-medium">CodeCrafters</span> locked their team for
            <span className="font-medium"> Hackathon 2026</span>.
          </p>

          <p className="text-sm text-neutral-600 mt-2">
            Official registration link unlocked.
          </p>

        </div>

      </div>

    </motion.div>
  );
}