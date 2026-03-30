"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { Github, Globe, Linkedin } from "lucide-react";
import AvatarPreview from "@/components/profile/AvatarPreview";
import AvatarCustomizerModal from "@/components/profile/AvatarCustomizerModal";

type ProfileSkill = {
  id: string;
  name: string;
};

type Avatar = {
  base: string;
  hair: string;
  outfit: string;
  accessory: string | null;
};

type StoreItem = {
  id: string;
  name: string;
  type: "hair" | "outfit" | "accessory";
  imageUrl: string;
  price: number;
};

type Participation = {
  id: string;
  status: string;
};

type ProfileResponse = {
  id: string;
  name: string | null;
  email: string;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  avatar?: Avatar | null;
  teamMembers?: Array<{ id: string }>;
  participations?: Participation[];
  skills?: Array<{ skill?: { id?: string; name?: string } }>;
};

type ProfilePanelProps = {
  open: boolean;
  onClose: () => void;
  userId?: string;
  name?: string | null;
  email?: string | null;
  currentUserId?: string;
  isEditable?: boolean;
};

const DEFAULT_PANEL_AVATAR: Avatar = {
  base: "base_default",
  hair: "hair_default",
  outfit: "outfit_default",
  accessory: null,
};

export default function ProfilePanel({
  open,
  onClose,
  userId,
  name,
  email,
  currentUserId,
  isEditable = true,
}: ProfilePanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [profileName, setProfileName] = useState(name ?? "SkillVibe User");
  const [profileEmail, setProfileEmail] = useState(email ?? "No email available");
  const [socialLinks, setSocialLinks] = useState<{
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
  }>({});
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_PANEL_AVATAR);

  const isOwnProfile = Boolean(userId && currentUserId && userId === currentUserId);
  const canEdit = isOwnProfile && isEditable;

  useEffect(() => {
    if (!open) return;

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
    if (!open || !userId) return;

    const loadPanel = async () => {
      try {
        setLoading(true);
        setError(null);

        const requests = [fetch(`/api/profile/${userId}`)];

        if (isOwnProfile) {
          requests.push(fetch("/api/avatar"));
          requests.push(fetch("/api/avatar/store"));
          requests.push(fetch("/api/users/participations"));
        }

        const responses = await Promise.all(requests);
        const payloads = await Promise.all(responses.map((response) => response.json()));

        const profileRes = responses[0];
        const profileData = payloads[0] as ProfileResponse;

        if (!profileRes.ok) {
          throw new Error(profileData?.email ?? "Failed to load profile");
        }

        setProfileName(profileData.name ?? name ?? "SkillVibe User");
        setProfileEmail(profileData.email ?? email ?? "No email available");
        setSocialLinks({
          linkedinUrl: profileData.linkedinUrl,
          githubUrl: profileData.githubUrl,
          portfolioUrl: profileData.portfolioUrl,
        });
        setAvatar(profileData.avatar ?? DEFAULT_PANEL_AVATAR);
        setSkills(
          (profileData.skills ?? [])
            .map((entry) => entry.skill)
            .filter(
              (skill): skill is ProfileSkill => Boolean(skill?.id && skill?.name),
            ),
        );
        setParticipations(profileData.participations ?? []);
        setTeamCount(profileData.teamMembers?.length ?? 0);

        if (isOwnProfile) {
          const avatarData = payloads[1] as {
            avatar?: Avatar;
            coins?: number;
            ownedItemIds?: string[];
            error?: string;
          };
          const storeData = payloads[2] as {
            items?: StoreItem[];
            ownedItemIds?: string[];
            coins?: number;
            error?: string;
          };
          const participationData = payloads[3];

          if (!responses[1].ok) {
            throw new Error(avatarData?.error ?? "Failed to load avatar");
          }

          if (!responses[2].ok) {
            throw new Error(storeData?.error ?? "Failed to load store");
          }

          setAvatar(avatarData.avatar ?? profileData.avatar ?? DEFAULT_PANEL_AVATAR);
          setCoins(avatarData.coins ?? 0);
          setOwnedItemIds(storeData.ownedItemIds ?? avatarData.ownedItemIds ?? []);
          setStoreItems(storeData.items ?? []);
          setParticipations(Array.isArray(participationData) ? participationData : []);
        } else {
          setCoins(0);
          setOwnedItemIds([]);
          setStoreItems([]);
        }
      } catch (fetchError) {
        console.error("PROFILE PANEL ERROR:", fetchError);
        setError("Unable to load quick profile panel");
      } finally {
        setLoading(false);
      }
    };

    loadPanel();
  }, [open, userId, isOwnProfile, name, email]);

  const stats = useMemo(() => {
    const confirmedParticipations = participations.filter(
      (entry) => entry.status === "CONFIRMED",
    ).length;

    return [
      { label: "Events Participated", value: participations.length },
      { label: "Events Won", value: 0 },
      { label: "Skills Count", value: skills.length },
      { label: "Teams Joined", value: teamCount || confirmedParticipations },
    ];
  }, [participations, skills.length, teamCount]);

  const socialButtons = [
    {
      label: "GitHub",
      href: socialLinks.githubUrl,
      icon: Github,
    },
    {
      label: "LinkedIn",
      href: socialLinks.linkedinUrl,
      icon: Linkedin,
    },
    {
      label: "Portfolio",
      href: socialLinks.portfolioUrl,
      icon: Globe,
    },
  ].filter((entry) => Boolean(entry.href));

  const handleAvatarSelect = async (
    type: "hair" | "outfit" | "accessory",
    itemId: string | null,
  ) => {
    try {
      const res = await fetch("/api/avatar/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          [type]: itemId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to update avatar");
        return;
      }

      setAvatar(data.avatar);
      setError(null);
    } catch (updateError) {
      console.error("PROFILE PANEL AVATAR UPDATE ERROR:", updateError);
      setError("Failed to update avatar");
    }
  };

  const handleBuyItem = async (itemId: string) => {
    try {
      setBusyItemId(itemId);

      const res = await fetch("/api/avatar/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to buy item");
        return;
      }

      setCoins(data.coins ?? coins);
      setOwnedItemIds(data.ownedItemIds ?? ownedItemIds);
      setError(null);
    } catch (buyError) {
      console.error("PROFILE PANEL BUY ERROR:", buyError);
      setError("Failed to buy item");
    } finally {
      setBusyItemId(null);
    }
  };

  const handleAddCoins = async (amount: number) => {
    try {
      const res = await fetch("/api/coins/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to add coins");
        return;
      }

      setCoins(data.coins ?? coins);
      setError(null);
    } catch (coinError) {
      console.error("PROFILE PANEL COIN ERROR:", coinError);
      setError("Failed to add coins");
    }
  };

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              aria-label="Close profile panel"
              className="absolute inset-0 bg-neutral-950/35 backdrop-blur-[2px]"
              onClick={onClose}
            />

            <motion.aside
              initial={{ x: 28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 28, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="absolute top-4 right-4 bottom-4 w-[min(420px,calc(100vw-2rem))] rounded-[28px] overflow-hidden bg-white shadow-2xl border border-white/70"
            >
              <div className="h-full flex flex-col">
                <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-emerald-400 text-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-[1.5rem] bg-white/12 p-2 backdrop-blur-sm">
                        <AvatarPreview
                          base={avatar.base}
                          hair={avatar.hair}
                          outfit={avatar.outfit}
                          accessory={avatar.accessory}
                          size="sm"
                        />
                      </div>

                      <div>
                        <p className="text-xl font-semibold">{profileName}</p>
                        <p className="text-sm text-white/80">{profileEmail}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/20 transition"
                    >
                      x
                    </button>
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium">
                    <span>Coins</span>
                    <span>{isOwnProfile ? coins : "Private"}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-white to-neutral-50">
                  {loading ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border border-neutral-100 bg-neutral-100 h-24"
                          />
                        ))}
                      </div>
                      <div className="rounded-2xl border border-neutral-100 bg-neutral-100 h-32" />
                      <div className="rounded-2xl border border-neutral-100 bg-neutral-100 h-28" />
                    </div>
                  ) : (
                    <>
                      {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {error}
                        </div>
                      ) : null}

                      <section className="grid grid-cols-2 gap-3">
                        {stats.map((stat) => (
                          <motion.div
                            key={stat.label}
                            whileHover={{ scale: 1.02 }}
                            className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                          >
                            <p className="text-xs text-neutral-500">{stat.label}</p>
                            <p className="mt-2 text-2xl font-semibold text-neutral-900">
                              {stat.value}
                            </p>
                          </motion.div>
                        ))}
                      </section>

                      {socialButtons.length > 0 ? (
                        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                          <p className="text-sm font-medium text-neutral-800 mb-4">
                            Social Links
                          </p>

                          <div className="flex flex-wrap gap-3">
                            {socialButtons.map((entry) => {
                              const Icon = entry.icon;

                              return (
                                <a
                                  key={entry.label}
                                  href={entry.href ?? "#"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-sm text-neutral-700 transition"
                                >
                                  <Icon size={16} />
                                  <span>{entry.label}</span>
                                </a>
                              );
                            })}
                          </div>
                        </section>
                      ) : null}

                      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-800">Avatar Snapshot</p>
                            <p className="text-sm text-neutral-500">
                              {isOwnProfile
                                ? "Your equipped style and coin balance."
                                : "A quick look at this member's avatar identity."}
                            </p>
                          </div>

                          <AvatarPreview
                            base={avatar.base}
                            hair={avatar.hair}
                            outfit={avatar.outfit}
                            accessory={avatar.accessory}
                            size="sm"
                          />
                        </div>

                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => setCustomizerOpen(true)}
                            className="w-full rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-medium px-4 py-3 transition"
                          >
                            Customize Avatar
                          </button>
                        ) : (
                          <p className="text-sm text-neutral-500">
                            Avatar customization is only available on your own profile.
                          </p>
                        )}
                      </section>

                      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-800">Skills</p>
                            <p className="text-sm text-neutral-500">
                              Quick glance at active profile strengths.
                            </p>
                          </div>
                        </div>

                        {skills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                              <span
                                key={skill.id}
                                className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-500">No skills added yet.</p>
                        )}
                      </section>

                      <section className="grid gap-3">
                        <motion.div whileHover={{ scale: 1.01 }}>
                          <Link
                            href="/profile"
                            onClick={onClose}
                            className="block rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-4 shadow-md"
                          >
                            <p className="font-medium">View Full Profile</p>
                            <p className="text-sm text-white/80 mt-1">
                              Open the complete profile and settings page.
                            </p>
                          </Link>
                        </motion.div>

                        {canEdit ? (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 px-5 py-4 text-left shadow-sm transition"
                          >
                            <p className="font-medium text-neutral-900">Logout</p>
                            <p className="text-sm text-neutral-500 mt-1">
                              End your current session safely.
                            </p>
                          </motion.button>
                        ) : null}
                      </section>
                    </>
                  )}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {customizerOpen && canEdit ? (
        <AvatarCustomizerModal
          avatar={avatar}
          items={storeItems}
          ownedItemIds={ownedItemIds}
          coins={coins}
          busyItemId={busyItemId}
          onClose={() => setCustomizerOpen(false)}
          onSelect={handleAvatarSelect}
          onBuy={handleBuyItem}
          onAddCoins={handleAddCoins}
        />
      ) : null}
    </>
  );
}
