"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  const { data: session } = useSession();

  function navItem(href: string, label: string) {
    const active = pathname === href;

    return (
      <Link
        href={href}
        className={`block px-4 py-2 rounded-lg transition ${
          active
            ? "bg-indigo-600 text-white"
            : "text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        {label}
      </Link>
    );
  }

  return (

    <div className="flex min-h-screen bg-neutral-100">

      {/* SIDEBAR */}

      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 bg-white border-r border-neutral-200 flex flex-col"
      >

        {/* LOGO */}

        <div className="px-6 py-6 border-b border-neutral-200">

          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            SkillVibe
          </span>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 px-4 py-6 space-y-2">

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

      {/* MAIN AREA */}

      <div className="flex-1 flex flex-col">

        {/* TOP BAR */}

        <header className="bg-white border-b border-neutral-200">

          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">

            <div className="text-lg font-semibold text-neutral-800 capitalize">
              {pathname.replace("/", "") || "dashboard"}
            </div>

            {/* USER */}

            <div className="flex items-center gap-4">

              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                {session?.user?.name?.[0] ?? "U"}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </motion.button>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <main className="flex-1 px-8 py-10">
          {children}
        </main>

      </div>

    </div>

  );

}