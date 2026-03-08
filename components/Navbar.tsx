"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function Navbar() {

  const { data: session } = useSession();

  return (
    <header className="fixed top-0 w-full bg-white/70 backdrop-blur border-b border-neutral-200 z-50">

      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        {/* Logo */}
        <Link
          href="/"
          className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
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

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg"
              >
                Logout
              </motion.button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm">
                Login
              </Link>

              <Link
                href="/register"
                className="bg-black text-white px-4 py-2 rounded-lg text-sm"
              >
                Get Started
              </Link>
            </>
          )}

        </div>

      </div>

    </header>
  );
}