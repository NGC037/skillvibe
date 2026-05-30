"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProfilePanel from "@/components/profile/ProfilePanel";
import NotificationBell from "@/components/NotificationBell";

export default function AppLayout({
  children,
  hideSidebar = false,
}: {
  children: React.ReactNode;
  hideSidebar?: boolean;
}) {

  const pathname = usePathname();
  const { data: session } = useSession();
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  function navItem(href: string, label: string) {
    const active = pathname === href;

    return (
      <Link
        href={href}
        className={`block px-4 py-2 rounded-lg transition ${
          active
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md"
            : "text-neutral-700 hover:bg-white hover:text-neutral-950"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (

    <div className="flex min-h-screen flex-col bg-transparent md:flex-row">

      {/* SIDEBAR */}

      {!hideSidebar ? (
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full border-b border-white/70 bg-white/75 backdrop-blur-xl shadow-[18px_0_40px_-32px_rgba(79,70,229,0.35)] md:w-72 md:flex-shrink-0 md:border-b-0 md:border-r"
      >

        {/* LOGO */}

        <div className="px-5 py-5 border-b border-white/70 md:px-7 md:py-7">

          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 bg-clip-text text-transparent">
            SkillVibe
          </span>

          <p className="mt-2 text-sm text-neutral-500">
            Governance-first collaboration
          </p>

        </div>

        {/* NAVIGATION */}

        <nav className="flex gap-2 overflow-x-auto px-4 py-4 md:block md:flex-1 md:space-y-2 md:overflow-visible md:py-6">

          {/* STUDENT */}

          {session?.user?.role === "STUDENT" && (

            <>
              {navItem("/dashboard", "Dashboard")}
              {navItem("/events", "Events")}
              {navItem("/teams", "Teams")}
              {navItem("/profile", "Profile")}
              {navItem("/posts", "Skill Posts")}
            </>

          )}

          {/* ADMIN */}

          {session?.user?.role === "ADMIN" && (
            <>
              {navItem("/admin", "Admin Dashboard")}
            </>
          )}

          {/* MENTOR */}

          {session?.user?.role === "MENTOR" && (
            <>
              {navItem("/mentor", "Mentor Dashboard")}
            </>
          )}

        </nav>

      </motion.aside>
      ) : null}

      {/* MAIN AREA */}

      <div className="flex min-w-0 flex-1 flex-col">

        {/* TOP BAR */}

        <header className="border-b border-white/70 bg-white/60 backdrop-blur-xl">

          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">

            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-neutral-400">
                SkillVibe workspace
              </p>
              <div className="text-2xl font-semibold text-neutral-900 capitalize">
                {pathname.replace("/", "") || "dashboard"}
              </div>
            </div>

            {/* USER */}

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <NotificationBell />

              <button
                type="button"
                onClick={() => setProfilePanelOpen(true)}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-teal-500 hover:shadow-lg transition flex items-center justify-center text-white font-semibold shadow-md ring-4 ring-white/70"
              >
                {session?.user?.name?.[0] ?? "U"}
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-neutral-900 text-white px-4 py-2.5 rounded-xl text-sm shadow-sm transition"
              >
                Logout
              </motion.button>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="flex-1 px-4 py-8 sm:px-8 sm:py-10"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <ProfilePanel
          open={profilePanelOpen}
          onClose={() => setProfilePanelOpen(false)}
          userId={session?.user?.id}
          currentUserId={session?.user?.id}
          name={session?.user?.name}
          email={session?.user?.email}
        />

      </div>

    </div>

  );

}
