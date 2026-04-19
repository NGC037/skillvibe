"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";

type DashboardSkill = {
  id: string;
  name: string;
  level: string;
};

type DashboardParticipation = {
  id: string;
  status: string;
  event?: {
    title?: string;
  };
};

type DashboardPost = {
  id: string;
  title: string;
  interestCount: number;
  creator?: {
    id?: string;
  };
};

type AvatarSummaryResponse = {
  coins?: number;
};

const statCards = [
  { label: "Skills", accent: "from-purple-500 to-indigo-500" },
  { label: "Participations", accent: "from-teal-500 to-emerald-500" },
  { label: "Confirmed Events", accent: "from-amber-400 to-orange-500" },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (session?.user?.role === "MENTOR") {
    redirect("/mentor");
  }

  const [skills, setSkills] = useState<DashboardSkill[]>([]);
  const [participations, setParticipations] = useState<DashboardParticipation[]>([]);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    fetch("/api/users/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const formatted = data.userSkills.map(
            (userSkill: {
              skill: { id: string; name: string };
              level: string;
            }) => ({
              id: userSkill.skill.id,
              name: userSkill.skill.name,
              level: userSkill.level,
            }),
          );

          setSkills(formatted);
        }
      });
  }, []);

  useEffect(() => {
    fetch("/api/users/participations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setParticipations(data);
        } else if (Array.isArray(data.participations)) {
          setParticipations(data.participations);
        } else {
          setParticipations([]);
        }
      });
  }, []);

  useEffect(() => {
    fetch("/api/posts/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const myPosts = data.posts.filter(
            (post: DashboardPost) => post.creator?.id === session?.user?.id,
          );

          setPosts(myPosts);
        }
      });
  }, [session]);

  useEffect(() => {
    fetch("/api/avatar")
      .then((res) => res.json())
      .then((data: AvatarSummaryResponse) => {
        setCoins(data.coins ?? 0);
      })
      .catch(() => {
        setCoins(0);
      });
  }, []);

  if (status === "loading") {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="surface-card-strong p-8">
            <div className="shimmer-skeleton h-8 w-64 rounded-full" />
            <div className="shimmer-skeleton mt-4 h-4 w-96 rounded-full" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="surface-card p-6">
                <div className="shimmer-skeleton h-4 w-24 rounded-full" />
                <div className="shimmer-skeleton mt-4 h-10 w-16 rounded-2xl" />
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="surface-card p-6 space-y-4">
              <div className="shimmer-skeleton h-5 w-32 rounded-full" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="shimmer-skeleton h-10 w-32 rounded-full" />
                ))}
              </div>
            </div>
            <div className="surface-card p-6 space-y-4">
              <div className="shimmer-skeleton h-5 w-40 rounded-full" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="shimmer-skeleton h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const confirmedCount = participations.filter(
    (participation) => participation.status === "CONFIRMED",
  ).length;
  const userName = session?.user?.name || "Student";

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 p-8 shadow-[0_24px_70px_-30px_rgba(79,70,229,0.55)]"
        >
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-purple-200">
                Student command center
              </p>
              <h1 className="mt-3 text-3xl font-bold text-white">
                Welcome back, {userName}
              </h1>
              <p className="mt-3 max-w-2xl text-white/85">
                Manage your skills, teams, and event participation with SkillVibe.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/14 px-4 py-4 text-white backdrop-blur">
                <p className="text-xs text-white/70">Skill profile</p>
                <p className="mt-2 text-2xl font-semibold">{skills.length}</p>
              </div>
              <div className="rounded-2xl bg-white/14 px-4 py-4 text-white backdrop-blur">
                <p className="text-xs text-white/70">Live participations</p>
                <p className="mt-2 text-2xl font-semibold">{participations.length}</p>
              </div>
              <div className="rounded-2xl bg-white/14 px-4 py-4 text-white backdrop-blur">
                <p className="text-xs text-white/70">Confirmed</p>
                <p className="mt-2 text-2xl font-semibold">{confirmedCount}</p>
              </div>
              <div className="rounded-2xl bg-white/14 px-4 py-4 text-white backdrop-blur">
                <p className="text-xs text-white/70">Coins</p>
                <p className="mt-2 text-2xl font-semibold">{coins}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {statCards.map((stat, index) => {
            const value =
              stat.label === "Skills"
                ? skills.length
                : stat.label === "Participations"
                  ? participations.length
                  : confirmedCount;

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="surface-card interactive-card p-6"
              >
                <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${stat.accent}`} />
                <div className="mt-5 text-sm text-neutral-500">{stat.label}</div>
                <div className="mt-2 text-4xl font-bold text-neutral-900">{value}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="surface-card p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Your Skills</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Skills that shape your team and event fit.
                </p>
              </div>
            </div>

            {skills.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-neutral-600">
                No skills added yet. Go to Profile and add your skills.
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <motion.div
                    key={skill.id}
                    whileHover={{ scale: 1.04 }}
                    className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm"
                  >
                    {skill.name} - {skill.level}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="surface-card p-6"
          >
            <h2 className="text-xl font-semibold text-neutral-900">Your Skill Requests</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Track the reach of your collaboration posts.
            </p>

            {posts.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-neutral-600">
                You have not created any skill requests yet.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="interactive-card rounded-2xl border border-neutral-200 bg-gradient-to-r from-white to-neutral-50 p-4"
                  >
                    <div className="font-semibold text-neutral-900">{post.title}</div>
                    <div className="mt-1 text-sm text-neutral-600">
                      {post.interestCount} interested candidates
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="surface-card p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Event Participation</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Your current registration and confirmation status.
              </p>
            </div>

            <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              {confirmedCount} confirmed
            </div>
          </div>

          {participations.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-8 text-neutral-600">
              You have not joined any events yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {participations.map((participation, index) => (
                <motion.div
                  key={participation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="interactive-card rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5"
                >
                  <div className="font-semibold text-neutral-900">
                    {participation.event?.title || "Untitled event"}
                  </div>

                  <div className="mt-3 text-sm">
                    Status{" "}
                    <span
                      className={`font-medium ${
                        participation.status === "CONFIRMED"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {participation.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
