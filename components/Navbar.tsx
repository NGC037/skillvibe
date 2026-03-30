"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import ProfilePanel from "@/components/profile/ProfilePanel";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {

  const { data: session } = useSession();
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-white/65 backdrop-blur-xl border-b border-white/70 z-50 shadow-[0_12px_40px_-30px_rgba(79,70,229,0.35)]">

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link
          href="/"
          className="font-semibold text-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent"
        >
          SkillVibe
        </Link>

        {/* Right section */}

        <div className="flex items-center gap-4">

          {session ? (
            <>
              <span className="text-sm text-neutral-600">
                {session.user?.name}
              </span>

              <NotificationBell />

              <button
                type="button"
                onClick={() => setProfilePanelOpen(true)}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-teal-500 text-white font-semibold shadow-md hover:scale-105 transition ring-4 ring-white/70"
              >
                {session.user?.name?.[0] ?? "U"}
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-sm"
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-neutral-700 hover:text-neutral-950 transition">
                Login
              </Link>

              <Link
                href="/register"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg transition"
              >
                Get Started
              </Link>
            </>
          )}

        </div>

      </div>

      <ProfilePanel
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        userId={session?.user?.id}
        currentUserId={session?.user?.id}
        name={session?.user?.name}
        email={session?.user?.email}
      />

    </header>
  );
}
