"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Skill = {
  id: string;
  name: string;
};

type UserSummary = {
  id?: string;
  name: string;
  department?: string;
  division?: string;
  year?: number;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  bio?: string;
  skills?: Skill[];
};

type ProfileEvent = {
  id: string;
  participationId: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  registrationStartDate: string | null;
  registrationEndDate: string | null;
  status: string;
  participatedAt: string;
};

type ProfileWin = {
  id: string;
  title: string;
  eventName: string;
  createdAt: string;
  posterUrl: string | null;
};

type ProfileCertificate = {
  id: string;
  title: string;
  eventName: string;
  type: "WON" | "PARTICIPATED";
  fileUrl: string;
  createdAt: string;
  coinsAwarded: number;
  isSkillVibeEvent: boolean;
  category: "Won" | "Participated" | "SkillVibe Events";
};

type ProfileResponse = {
  id: string;
  name: string | null;
  email: string;
  department?: string | null;
  division?: string | null;
  year?: number | null;
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  skills?: Array<{ skill?: Skill }>;
  events?: ProfileEvent[];
  wins?: ProfileWin[];
  certificates?: ProfileCertificate[];
};

type TabId = "overview" | "events" | "achievements";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "events", label: "Events" },
  { id: "achievements", label: "Achievements" },
];

export default function ProfileModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserSummary | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveTab("overview");
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    const userId = user?.id;

    if (!open || !userId) {
      setProfile(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/profile/${userId}`);
        const data: ProfileResponse | { error?: string } = await response.json();

        if (!response.ok || "error" in data) {
          throw new Error(("error" in data && data.error) || "Failed to load profile");
        }

        if (!cancelled) {
          setProfile(data as ProfileResponse);
        }
      } catch (loadError) {
        console.error("PROFILE MODAL ERROR:", loadError);
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  const mergedSkills = useMemo(() => {
    if (profile?.skills && profile.skills.length > 0) {
      return profile.skills
        .map((entry) => entry.skill)
        .filter((skill): skill is Skill => Boolean(skill?.id && skill?.name));
    }

    return user?.skills ?? [];
  }, [profile?.skills, user?.skills]);

  const mergedName = profile?.name ?? user?.name ?? "SkillVibe Member";
  const mergedDepartment = profile?.department ?? user?.department;
  const mergedDivision = profile?.division ?? user?.division;
  const mergedYear = profile?.year ?? user?.year;
  const mergedBio = profile?.bio ?? user?.bio ?? "";
  const socialLinks = {
    linkedinUrl: profile?.linkedinUrl ?? user?.linkedinUrl,
    githubUrl: profile?.githubUrl ?? user?.githubUrl,
    portfolioUrl: profile?.portfolioUrl ?? user?.portfolioUrl,
  };

  const events = profile?.events ?? [];
  const wins = profile?.wins ?? [];
  const certificates = profile?.certificates ?? [];

  const badges = useMemo(() => {
    const generatedBadges: string[] = [];

    if (wins.length >= 2) {
      generatedBadges.push("Top Performer");
    }
    if (events.length >= 3) {
      generatedBadges.push("Active");
    }
    if (certificates.length >= 1) {
      generatedBadges.push("Certified");
    }
    if (mergedSkills.length >= 4) {
      generatedBadges.push("Multi-Skilled");
    }

    return generatedBadges.length > 0 ? generatedBadges : ["Rising Talent"];
  }, [certificates.length, events.length, mergedSkills.length, wins.length]);

  if (!user) {
    return null;
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close profile modal"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative z-10 flex h-[min(88vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/35 bg-white/16 shadow-[0_30px_120px_-35px_rgba(15,23,42,0.75)] backdrop-blur-2xl"
          >
            <div className="border-b border-white/20 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.28),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(79,70,229,0.84),_rgba(14,165,233,0.78))] px-8 py-8 text-white">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex rounded-full bg-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                    SkillVibe Profile
                  </div>
                  <h2 className="mt-4 text-4xl font-semibold">{mergedName}</h2>
                  <p className="mt-3 text-sm text-white/80">
                    {formatMeta(mergedDepartment, mergedDivision, mergedYear)}
                  </p>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82">
                    {mergedBio || "This member has not added a bio yet."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-white/15 bg-white/14 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="grid min-w-[220px] grid-cols-2 gap-3">
                    <GlassStat label="Events" value={`${events.length}`} />
                    <GlassStat label="Wins" value={`${wins.length}`} />
                    <GlassStat label="Certificates" value={`${certificates.length}`} />
                    <GlassStat label="Skills" value={`${mergedSkills.length}`} />
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-white/14 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/22"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-black/5 bg-white/55 px-8 py-4 backdrop-blur-xl">
              <div className="flex flex-wrap gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeTab === tab.id
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-white/70 text-neutral-600 hover:bg-white hover:text-neutral-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(248,250,252,0.9))] px-8 py-8">
              {loading ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-32 animate-pulse rounded-[1.5rem] bg-white/80" />
                    ))}
                  </div>
                  <div className="h-64 animate-pulse rounded-[1.75rem] bg-white/80" />
                </div>
              ) : error ? (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                  {error}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    {activeTab === "overview" ? (
                      <>
                        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                          <SectionCard
                            title="Overview Snapshot"
                            subtitle="Quick summary of engagement, skills, and presence."
                          >
                            <div className="grid gap-4 sm:grid-cols-2">
                              <MetricCard label="Events Participated" value={`${events.length}`} />
                              <MetricCard label="Wins" value={`${wins.length}`} />
                              <MetricCard label="Certificates" value={`${certificates.length}`} />
                              <MetricCard label="Skill Count" value={`${mergedSkills.length}`} />
                            </div>
                          </SectionCard>

                          <SectionCard
                            title="Profile Badges"
                            subtitle="Recognition generated from activity and achievements."
                          >
                            <div className="flex flex-wrap gap-3">
                              {badges.map((badge, index) => (
                                <span
                                  key={badge}
                                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                                    index % 2 === 0
                                      ? "bg-gradient-to-r from-amber-100 to-orange-100 text-orange-800"
                                      : "bg-gradient-to-r from-cyan-100 to-indigo-100 text-indigo-800"
                                  }`}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </SectionCard>
                        </div>

                        <SectionCard
                          title="Skill Highlights"
                          subtitle="Core strengths shown as profile chips."
                        >
                          {mergedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {mergedSkills.map((skill) => (
                                <span
                                  key={skill.id}
                                  className="rounded-full bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700"
                                >
                                  {skill.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <EmptyState message="No skills listed yet." />
                          )}
                        </SectionCard>

                        <SectionCard
                          title="Links"
                          subtitle="Professional links and external profile touchpoints."
                        >
                          <div className="grid gap-3 sm:grid-cols-3">
                            <LinkCard label="LinkedIn" href={socialLinks.linkedinUrl} />
                            <LinkCard label="GitHub" href={socialLinks.githubUrl} />
                            <LinkCard label="Portfolio" href={socialLinks.portfolioUrl} />
                          </div>
                        </SectionCard>
                      </>
                    ) : null}

                    {activeTab === "events" ? (
                      <SectionCard
                        title="Event Journey"
                        subtitle="Participations and event involvement, shown in a scrollable card timeline."
                      >
                        <div className="max-h-[26rem] space-y-4 overflow-y-auto pr-1">
                          {events.length > 0 ? (
                            events.map((event) => (
                              <div
                                key={event.participationId}
                                className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white"
                              >
                                <div className="grid gap-0 md:grid-cols-[220px_1fr]">
                                  <div className="h-40 bg-gradient-to-br from-slate-900 via-indigo-700 to-cyan-500">
                                    {event.posterUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={event.posterUrl}
                                        alt={event.title}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full items-end p-4 text-white">
                                        <p className="text-lg font-semibold">{event.title}</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <h3 className="text-lg font-semibold text-neutral-900">
                                          {event.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-neutral-500">
                                          {formatDateRange(
                                            event.registrationStartDate,
                                            event.registrationEndDate,
                                          )}
                                        </p>
                                      </div>

                                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                                        {event.status}
                                      </span>
                                    </div>

                                    <p className="mt-3 text-sm leading-6 text-neutral-600">
                                      {event.description || "No event description available."}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <EmptyState message="No event participations to show yet." />
                          )}
                        </div>
                      </SectionCard>
                    ) : null}

                    {activeTab === "achievements" ? (
                      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                        <SectionCard
                          title="Wins"
                          subtitle="Recognized achievements and winning outcomes."
                        >
                          <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                            {wins.length > 0 ? (
                              wins.map((win) => (
                                <div
                                  key={win.id}
                                  className="rounded-[1.5rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-neutral-900">{win.title}</p>
                                      <p className="mt-1 text-sm text-neutral-600">
                                        {win.eventName}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-800">
                                      Win
                                    </span>
                                  </div>
                                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
                                    {new Date(win.createdAt).toLocaleDateString("en-IN")}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <EmptyState message="No wins recorded yet." />
                            )}
                          </div>
                        </SectionCard>

                        <SectionCard
                          title="Certificates Preview"
                          subtitle="Achievement proofs, participation evidence, and SkillVibe-linked records."
                        >
                          <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                            {certificates.length > 0 ? (
                              certificates.map((certificate) => (
                                <a
                                  key={certificate.id}
                                  href={certificate.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-[1.5rem] border border-neutral-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-neutral-900">
                                        {certificate.title}
                                      </p>
                                      <p className="mt-1 text-sm text-neutral-600">
                                        {certificate.eventName}
                                      </p>
                                    </div>

                                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                                      {certificate.category}
                                    </span>
                                  </div>

                                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-neutral-500">
                                    <span>
                                      {new Date(certificate.createdAt).toLocaleDateString("en-IN")}
                                    </span>
                                    <span>+{certificate.coinsAwarded} coins</span>
                                    <span>Open proof</span>
                                  </div>
                                </a>
                              ))
                            ) : (
                              <EmptyState message="No certificates uploaded yet." />
                            )}
                          </div>
                        </SectionCard>
                      </div>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/72 p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function GlassStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/12 px-4 py-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.18em] text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function LinkCard({ label, href }: { label: string; href?: string | null }) {
  if (!href) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
        {label} not added
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-[1.5rem] border border-neutral-200 bg-white px-4 py-5 text-sm font-medium text-neutral-700 transition hover:border-indigo-200 hover:text-indigo-700"
    >
      {label}
    </a>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-neutral-50 px-5 py-10 text-center text-sm text-neutral-500">
      {message}
    </div>
  );
}

function formatMeta(
  department?: string | null,
  division?: string | null,
  year?: number | null,
) {
  const parts = [department, division ? `Division ${division}` : null, year ? `Year ${year}` : null]
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : "SkillVibe member";
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) {
    return "Dates to be announced";
  }

  const startLabel = start
    ? new Date(start).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";
  const endLabel = end
    ? new Date(end).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "TBD";

  return `${startLabel} - ${endLabel}`;
}
