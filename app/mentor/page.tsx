import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import MotionWrapper from "@/components/ui/MotionWrapper";
import MenteeGrid from "@/components/mentor/MenteeGrid";

export default async function MentorPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/dashboard");

  if (session.user.role !== Role.MENTOR) {
    redirect("/dashboard");
  }

  const mentees = await prisma.mentorMentee.findMany({
    where: { mentorId: session.user.id },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          year: true,
          division: true,
          skills: {
            select: {
              id: true,
              level: true,
              endorsed: true,
              skill: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-10">
        <MotionWrapper>
          <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 p-8 text-white shadow-[0_24px_70px_-30px_rgba(79,70,229,0.55)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/65">
                  Mentor dashboard
                </p>
                <h1 className="mt-3 text-3xl font-bold">My Mentees</h1>
                <p className="mt-2 text-white/90">
                  Students who selected you during onboarding.
                </p>
              </div>

              <Link
                href="/api/mentor/export"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-indigo-700 shadow-lg transition hover:scale-[1.02]"
              >
                Export Mentees CSV
              </Link>
            </div>
          </div>
        </MotionWrapper>

        <div className="surface-card p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Assigned Students
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Read-only view of the students mapped to your mentorship.
              </p>
            </div>

            <div className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
              {mentees.length} mentees
            </div>
          </div>

          <MenteeGrid
            mentorId={session.user.id}
            mentees={mentees.map((entry) => ({
              id: entry.student.id,
              name: entry.student.name,
              email: entry.student.email,
              department: entry.student.department,
              year: entry.student.year,
              division: entry.student.division,
              skills: entry.student.skills.map((skillEntry) => ({
                id: skillEntry.skill.id,
                name: skillEntry.skill.name,
                level: skillEntry.level,
                endorsed: skillEntry.endorsed,
              })),
            }))}
          />
        </div>
      </div>
    </AppLayout>
  );
}
