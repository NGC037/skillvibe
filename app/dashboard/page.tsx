"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (session?.user?.role === "MENTOR") {
    redirect("/mentor");
  }

  const [skills, setSkills] = useState<
    { id: string; name: string; level: string }[]
  >([]);

  const [participations, setParticipations] = useState<any[]>([]);
  const [userName, setUserName] = useState("Student");

  const [posts, setPosts] = useState<any[]>([]);

  /* ----------- SESSION PROTECTION ----------- */

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name);
    }
  }, [session]);

  /* ----------- FETCH SKILLS ----------- */

  useEffect(() => {
    fetch(`/api/users/skills`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const formatted = data.userSkills.map((us: any) => ({
            id: us.skill.id,
            name: us.skill.name,
            level: us.level,
          }));
          setSkills(formatted);
        }
      });
  }, []);

  /* ----------- FETCH PARTICIPATIONS ----------- */

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

  /* ----------- FETCH SKILL POSTS ----------- */

  useEffect(() => {
    fetch("/api/posts/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const myPosts = data.posts.filter(
            (p: any) => p.creator?.id === session?.user?.id,
          );

          setPosts(myPosts);
        }
      });
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading dashboard...
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* HERO WELCOME */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-8 shadow-lg"
        >
          <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>

          <p className="text-white/90 mt-2">
            Manage your skills, teams, and event participation with SkillVibe.
          </p>
        </motion.div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Skills",
              value: skills.length,
            },
            {
              label: "Participations",
              value: participations.length,
            },
            {
              label: "Confirmed Events",
              value: Array.isArray(participations)
                ? participations.filter((p) => p.status === "CONFIRMED").length
                : 0,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
            >
              <div className="text-sm text-neutral-600">{stat.label}</div>

              <div className="text-4xl font-bold text-neutral-900 mt-2">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* SKILLS SECTION */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Your Skills</h2>

          {skills.length === 0 ? (
            <p className="text-neutral-600">
              No skills added yet. Go to Profile and add your skills.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <motion.div
                  key={skill.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
                >
                  {skill.name} — {skill.level}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* SKILL REQUEST POSTS */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Your Skill Requests</h2>

          {posts.length === 0 ? (
            <p className="text-neutral-600">
              You have not created any skill requests yet.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border border-neutral-200 rounded-xl p-4 bg-neutral-50"
                >
                  <div className="font-semibold text-neutral-900">
                    {post.title}
                  </div>

                  <div className="text-sm text-neutral-600 mt-1">
                    {post.interestCount} interested candidates
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* PARTICIPATION */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold mb-4">Event Participation</h2>

          {participations.length === 0 ? (
            <p className="text-neutral-600">
              You have not joined any events yet.
            </p>
          ) : (
            <div className="space-y-4">
              {participations.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="border border-neutral-200 rounded-xl p-4 bg-neutral-50"
                >
                  <div className="font-semibold text-neutral-900">
                    {p.event?.title}
                  </div>

                  <div className="mt-1 text-sm">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        p.status === "CONFIRMED"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {p.status}
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
