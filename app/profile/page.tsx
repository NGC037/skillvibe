"use client";

import AppLayout from "@/components/layout/AppLayout";
import SkillSelector from "@/components/skills/SkillSelector";
import MotionWrapper from "@/components/ui/MotionWrapper";

export default function ProfilePage() {

  return (

    <AppLayout>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* PROFILE HERO */}

        <MotionWrapper>

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-10 shadow-lg">

            <h1 className="text-3xl font-bold">
              Your Profile
            </h1>

            <p className="text-white/90 mt-2">
              Manage your skills and strengthen your event participation profile.
            </p>

          </div>

        </MotionWrapper>


        {/* PROFILE OVERVIEW */}

        <MotionWrapper>

          <div className="bg-white border border-neutral-200 rounded-xl p-8 shadow-sm">

            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Skill Profile
            </h2>

            <p className="text-sm text-neutral-600 mb-6">
              Your skills help match you with suitable events and teams.
              Keep them updated to improve collaboration opportunities.
            </p>

            {/* SKILL SELECTOR */}

            <SkillSelector />

          </div>

        </MotionWrapper>


        {/* INFO CARD */}

        <MotionWrapper>

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-sm text-neutral-600">

            <p className="font-medium text-neutral-800 mb-2">
              Why skills matter
            </p>

            <ul className="list-disc pl-5 space-y-1">

              <li>Events match teams based on required skills</li>

              <li>Mentors can better evaluate team readiness</li>

              <li>Admins ensure structured participation</li>

            </ul>

          </div>

        </MotionWrapper>

      </div>

    </AppLayout>

  );

}