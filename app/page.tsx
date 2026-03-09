"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

import Navbar from "@/components/Navbar";
import FloatingBackground from "@/components/FloatingBackground";
import HeroDashboardPreview from "@/components/HeroDashboardPreview";
import SkillNetwork from "@/components/SkillNetwork";
import SkillMatchDemo from "@/components/SkillMatchDemo";
import TeamFormationDemo from "@/components/TeamFormationDemo";

/* ----------------------------------------------------- */
/* Animation Variants (prevents inline re-creation) */
/* ----------------------------------------------------- */

const heroAnimation = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const cardAnimation = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

/* ----------------------------------------------------- */
/* Static Data (avoids re-rendering arrays) */
/* ----------------------------------------------------- */

const rotatingTaglines = [
  "Students Build",
  2000,
  "Mentors Guide",
  2000,
  "Admins Govern",
  2000,
  "Teams Validate",
  2000,
  "Ideas Compete",
  2000,
];

const productCards = ["Events", "Teams", "Participation"];

const howItWorks = [
  {
    title: "Create Your Skill Profile",
    desc: "Students build their verified skill identity.",
  },
  {
    title: "Build a Team",
    desc: "Invite members and meet event requirements.",
  },
  {
    title: "Lock & Register",
    desc: "Only validated teams unlock official event registration.",
  },
];

const roles = [
  {
    title: "Students",
    desc: "Build skill-based teams and validate readiness before registration.",
    gradient: "from-purple-50 to-indigo-50 border-purple-100",
  },
  {
    title: "Mentors",
    desc: "Monitor teams and guide collaboration across events.",
    gradient: "from-blue-50 to-cyan-50 border-blue-100",
  },
  {
    title: "Administrators",
    desc: "Govern participation and enforce event readiness rules.",
    gradient: "from-pink-50 to-rose-50 border-pink-100",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-neutral-100 min-h-screen">
      <Navbar />

      {/* ----------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ----------------------------------------------------- */}

      <section
        aria-label="Hero"
        className="relative pt-40 pb-36 text-center overflow-hidden"
      >
        {/* Gradient Background */}

        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500 opacity-90" />
        <SkillNetwork />
        <FloatingBackground />

        <div className="relative max-w-7xl mx-auto px-6 text-white">
          <motion.h1
            variants={heroAnimation}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-7xl font-bold tracking-tight"
          >
            Where Great Event Teams Begin
          </motion.h1>

          {/* ROTATING TAGLINE */}

          <div className="mt-6 text-2xl font-semibold">
            <TypeAnimation
              sequence={rotatingTaglines}
              wrapper="span"
              speed={40}
              repeat={Infinity}
            />
          </div>

          <p className="mt-8 max-w-2xl mx-auto text-lg text-white/90">
            SkillVibe validates team readiness before official event
            registration. Build skill-based teams, enforce governance rules, and
            bring structured collaboration to academic competitions.
          </p>

          {/* CTA Buttons */}

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:scale-105 transition"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-black transition"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* HERO DASHBOARD PREVIEW */}

      <HeroDashboardPreview />

      {/* ----------------------------------------------------- */}
      {/* PRODUCT PREVIEW */}
      {/* ----------------------------------------------------- */}

      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          variants={cardAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-neutral-200 rounded-2xl p-10 shadow-xl"
        >
          <h2 className="text-3xl font-semibold text-center">
            Built for Structured Event Participation
          </h2>

          <p className="mt-4 text-neutral-600 text-center max-w-xl mx-auto">
            SkillVibe introduces a governance layer for academic competitions,
            ensuring teams meet requirements before registration.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {productCards.map((card, i) => (
              <motion.div
                key={card}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-neutral-50 border border-neutral-200 rounded-xl p-6"
              >
                <h3 className="font-medium">{card}</h3>

                <p className="text-sm text-neutral-500 mt-2">
                  Monitor and manage structured collaboration across events.
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
<div className="mt-12">
  <SkillMatchDemo />
</div>
      {/* ----------------------------------------------------- */}
      {/* HOW IT WORKS */}
      {/* ----------------------------------------------------- */}

      <section className="bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-semibold text-center">
            How SkillVibe Works
          </h2>
          <TeamFormationDemo />

          <div className="grid md:grid-cols-3 gap-10 mt-14">
            {howItWorks.map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="bg-neutral-50 border border-neutral-200 rounded-2xl p-8"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>

                <p className="mt-3 text-sm text-neutral-600">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- */}
      {/* ROLES */}
      {/* ----------------------------------------------------- */}

      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-semibold text-center">
          Designed for Every Role
        </h2>

        <div className="grid md:grid-cols-3 gap-8 mt-14">
          {roles.map((role) => (
            <div
              key={role.title}
              className={`p-8 rounded-2xl bg-gradient-to-br ${role.gradient} border`}
            >
              <h3 className="font-semibold text-lg">{role.title}</h3>

              <p className="mt-2 text-sm text-neutral-600">{role.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- */}
      {/* CTA */}
      {/* ----------------------------------------------------- */}

      <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-semibold">
            Build Better Event Teams Today
          </h2>

          <p className="mt-4 text-white/90">
            Join SkillVibe and experience governance-driven collaboration.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block bg-white text-black px-6 py-3 rounded-lg hover:scale-105 transition"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------- */}
      {/* FOOTER */}
      {/* ----------------------------------------------------- */}

      <footer className="bg-neutral-900 text-neutral-400">
        <div className="max-w-7xl mx-auto px-6 py-10 flex justify-between text-sm">
          <span>© {new Date().getFullYear()} SkillVibe</span>

          <span>Governance Driven Team Platform</span>
        </div>
      </footer>
    </main>
  );
}
