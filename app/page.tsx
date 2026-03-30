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

const heroAnimation = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const cardAnimation = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

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
    gradient: "from-teal-50 to-emerald-50 border-teal-100",
  },
];

export default function LandingPage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen bg-transparent"
    >
      <Navbar />

      <section
        aria-label="Hero"
        className="relative overflow-hidden pt-40 pb-32 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_34%)]" />
        <SkillNetwork />
        <FloatingBackground />

        <div className="relative mx-auto max-w-7xl px-6 text-white">
          <motion.h1
            variants={heroAnimation}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6 }}
            className="text-5xl font-bold tracking-tight leading-[0.95] md:text-7xl"
          >
            Where Great Event Teams Begin
          </motion.h1>

          <div className="mt-6 text-2xl font-semibold text-white/95">
            <TypeAnimation
              sequence={rotatingTaglines}
              wrapper="span"
              speed={40}
              repeat={Infinity}
            />
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-white/88">
            SkillVibe validates team readiness before official event registration.
            Build skill-based teams, enforce governance rules, and bring structured
            collaboration to academic competitions.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-2xl bg-white px-6 py-3.5 font-medium text-black shadow-lg transition hover:scale-[1.03]"
            >
              Get Started
            </Link>

            <Link
              href="/login"
              className="rounded-2xl border border-white/70 bg-white/10 px-6 py-3.5 backdrop-blur transition hover:bg-white hover:text-black"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <HeroDashboardPreview />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <motion.div
          variants={cardAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="surface-card-strong p-10"
        >
          <h2 className="text-center text-3xl font-semibold">
            Built for Structured Event Participation
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-center leading-7 text-neutral-600">
            SkillVibe introduces a governance layer for academic competitions,
            ensuring teams meet requirements before registration.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {productCards.map((card) => (
              <motion.div
                key={card}
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="interactive-card rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-6"
              >
                <h3 className="font-medium">{card}</h3>

                <p className="mt-2 text-sm text-neutral-500">
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

      <section className="border-y border-white/70 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-center text-3xl font-semibold">How SkillVibe Works</h2>
          <TeamFormationDemo />

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {howItWorks.map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="interactive-card rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-8"
              >
                <h3 className="text-lg font-semibold">{card.title}</h3>

                <p className="mt-3 text-sm text-neutral-600">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-3xl font-semibold">Designed for Every Role</h2>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {roles.map((role) => (
            <motion.div
              key={role.title}
              whileHover={{ y: -4 }}
              className={`interactive-card rounded-2xl border bg-gradient-to-br p-8 ${role.gradient}`}
            >
              <h3 className="text-lg font-semibold">{role.title}</h3>

              <p className="mt-2 text-sm text-neutral-600">{role.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-purple-700 via-indigo-600 to-teal-500 text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-4xl font-semibold">Build Better Event Teams Today</h2>

          <p className="mt-4 text-white/90">
            Join SkillVibe and experience governance-driven collaboration.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-block rounded-2xl bg-white px-6 py-3.5 text-black shadow-lg transition hover:scale-[1.03]"
          >
            Create Account
          </Link>
        </div>
      </section>

      <footer className="bg-neutral-900 text-neutral-400">
        <div className="mx-auto flex max-w-7xl justify-between px-6 py-10 text-sm">
          <span>© {new Date().getFullYear()} SkillVibe</span>
          <span>Governance Driven Team Platform</span>
        </div>
      </footer>
    </motion.main>
  );
}
