import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import MotionWrapper from "@/components/ui/MotionWrapper";
import MenteeDetailTabs from "@/components/mentor/MenteeDetailTabs";
import { getMentorMenteeDetails } from "@/lib/mentor-data";

export default async function MentorMenteeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== Role.MENTOR) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const details = await getMentorMenteeDetails(session.user.id, id);

  if (!details) {
    notFound();
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        <MotionWrapper>
          <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-slate-950 via-indigo-900 to-cyan-700 p-8 text-white shadow-[0_24px_70px_-30px_rgba(8,47,73,0.55)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/65">
                  Mentor deep profile
                </p>
                <h1 className="mt-3 text-3xl font-bold">
                  {details.mentee.name || "Student"}
                </h1>
                <p className="mt-2 text-white/85">{details.mentee.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Events
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {details.overview.totalEvents}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Wins
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {details.overview.winsCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Activity
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {details.overview.activityLevel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </MotionWrapper>

        <MenteeDetailTabs details={details} />
      </div>
    </AppLayout>
  );
}
