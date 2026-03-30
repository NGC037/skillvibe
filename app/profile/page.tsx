"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import SkillSelector from "@/components/skills/SkillSelector";
import MotionWrapper from "@/components/ui/MotionWrapper";
import AvatarPreview from "@/components/profile/AvatarPreview";
import AvatarCustomizerModal from "@/components/profile/AvatarCustomizerModal";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Skill = {
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

export default function ProfilePage() {
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarLoading, setAvatarLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [coins, setCoins] = useState(0);
  const [ownedItemIds, setOwnedItemIds] = useState<string[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [avatar, setAvatar] = useState<Avatar>({
    base: "base_default",
    hair: "hair_default",
    outfit: "outfit_default",
    accessory: null,
  });
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const fetchProfile = async () => {
      try {
        const [profileRes, avatarRes, storeRes] = await Promise.all([
          fetch(`/api/profile/${session.user.id}`),
          fetch("/api/avatar"),
          fetch("/api/avatar/store"),
        ]);

        const profileData = await profileRes.json();

        if (profileRes.ok) {
          setBio(profileData.bio || "");
          setSkills(profileData.skills || []);
        }

        if (avatarRes.ok) {
          const avatarData = await avatarRes.json();
          setAvatar(avatarData.avatar);
          setCoins(avatarData.coins ?? 0);
          setOwnedItemIds(avatarData.ownedItemIds ?? []);
          setAvatarError(null);
        } else {
          const avatarData = await avatarRes.json();
          setAvatarError(avatarData?.error ?? "Failed to load avatar");
        }

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          setStoreItems(storeData.items ?? []);
          setCoins((currentCoins) => storeData.coins ?? currentCoins);
          setOwnedItemIds((currentItems) => storeData.ownedItemIds ?? currentItems);
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setAvatarError("Failed to load avatar experience");
      } finally {
        setLoading(false);
        setAvatarLoading(false);
      }
    };

    fetchProfile();
  }, [status, session]);

  const handleSave = async () => {
    await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bio,
      }),
    });

    const userId = session?.user?.id;

    if (!userId) return;

    const updated = await fetch(`/api/profile/${userId}`).then((response) =>
      response.json(),
    );

    setBio(updated.bio || "");
    setSkills(updated.skills || []);
    setIsEditing(false);
    router.refresh();
  };

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
        setAvatarError(data?.error ?? "Failed to update avatar");
        return;
      }

      setAvatar(data.avatar);
      setAvatarError(null);
    } catch (error) {
      console.error("Avatar update error:", error);
      setAvatarError("Failed to update avatar");
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
        setAvatarError(data?.error ?? "Failed to buy item");
        return;
      }

      setCoins(data.coins ?? coins);
      setOwnedItemIds(data.ownedItemIds ?? ownedItemIds);
      setAvatarError(null);
    } catch (error) {
      console.error("Avatar purchase error:", error);
      setAvatarError("Failed to buy item");
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
        setAvatarError(data?.error ?? "Failed to add coins");
        return;
      }

      setCoins(data.coins ?? coins);
      setAvatarError(null);
    } catch (error) {
      console.error("Add coins error:", error);
      setAvatarError("Failed to add coins");
    }
  };

  const getCompletion = () => {
    let score = 0;

    if (bio) score += 40;
    if (skills.length > 0) score += 60;

    return score;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="surface-card-strong p-8">
            <div className="shimmer-skeleton h-8 w-56 rounded-full" />
            <div className="shimmer-skeleton mt-4 h-4 w-40 rounded-full" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="surface-card p-6 space-y-4">
              <div className="shimmer-skeleton h-4 w-32 rounded-full" />
              <div className="shimmer-skeleton h-3 w-full rounded-full" />
            </div>
            <div className="surface-card p-6">
              <div className="animate-pulse space-y-4">
                <div className="shimmer-skeleton h-5 w-32 rounded-full" />
                <div className="shimmer-skeleton h-40 w-40 rounded-[2rem]" />
                <div className="shimmer-skeleton h-10 w-40 rounded-xl" />
              </div>
            </div>
          </div>
          <div className="surface-card p-8 space-y-4">
            <div className="shimmer-skeleton h-5 w-28 rounded-full" />
            <div className="shimmer-skeleton h-28 w-full rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-10">
        <MotionWrapper>
          <div className="overflow-hidden rounded-[1.75rem] border border-white/20 bg-gradient-to-br from-purple-700 via-indigo-600 to-teal-500 p-8 text-white shadow-[0_24px_70px_-30px_rgba(79,70,229,0.55)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="rounded-[2rem] bg-white/12 p-2 backdrop-blur">
                  <AvatarPreview
                    base={avatar.base}
                    hair={avatar.hair}
                    outfit={avatar.outfit}
                    accessory={avatar.accessory}
                    size="sm"
                  />
                </div>

                <div>
                  <h1 className="text-3xl font-bold">
                    {session?.user?.name || "User"}
                  </h1>
                  <p className="mt-2 text-sm text-white/80">{session?.user?.role}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-white/12 px-5 py-4 text-right backdrop-blur">
                <div className="text-xs uppercase tracking-[0.22em] text-white/65">
                  SkillVibe profile
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-medium">
                  <span>Coin Balance</span>
                  <span>{coins}</span>
                </div>
              </div>
            </div>
          </div>
        </MotionWrapper>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <MotionWrapper>
            <div className="surface-card p-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">Profile Strength</p>
                <p className="text-sm font-semibold text-neutral-900">{getCompletion()}%</p>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 transition-all"
                  style={{ width: `${getCompletion()}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <p className="text-neutral-500">Bio completeness</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-900">
                    {bio ? "Ready" : "Start"}
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                  <p className="text-neutral-500">Skills added</p>
                  <p className="mt-2 text-2xl font-semibold text-neutral-900">
                    {skills.length}
                  </p>
                </div>
              </div>
            </div>
          </MotionWrapper>

          <MotionWrapper>
            <div className="surface-card p-6">
              {avatarLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="shimmer-skeleton h-5 w-32 rounded-full" />
                  <div className="shimmer-skeleton h-40 w-40 rounded-[2rem]" />
                  <div className="shimmer-skeleton h-10 w-40 rounded-xl" />
                </div>
              ) : (
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="rounded-[2rem] bg-gradient-to-br from-purple-50 via-white to-teal-50 p-2">
                    <AvatarPreview
                      base={avatar.base}
                      hair={avatar.hair}
                      outfit={avatar.outfit}
                      accessory={avatar.accessory}
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold text-neutral-900">Avatar Card</h2>
                        <p className="mt-2 text-sm text-neutral-600">
                          Build your profile identity with layered cosmetic items.
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                        {coins} Coins
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                        <p className="text-neutral-500">Owned Items</p>
                        <p className="font-semibold text-neutral-900">{ownedItemIds.length}</p>
                      </div>
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
                        <p className="text-neutral-500">Equipped Accessory</p>
                        <p className="font-semibold text-neutral-900">
                          {avatar.accessory ? "Enabled" : "None"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCustomizerOpen(true)}
                        className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-black"
                      >
                        Customize Avatar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddCoins(25)}
                        className="rounded-2xl bg-amber-100 px-5 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-200"
                      >
                        Add 25 Coins
                      </button>
                    </div>

                    {avatarError ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {avatarError}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </MotionWrapper>
        </div>

        <MotionWrapper>
          <div className="surface-card p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Bio</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Introduce yourself and make your profile more credible.
                </p>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-5">
                <label htmlFor="bio" className="text-sm text-neutral-600">
                  Edit your bio
                </label>

                <textarea
                  id="bio"
                  placeholder="Write something about yourself..."
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className="mt-2 min-h-36 w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none ring-0 transition focus:border-indigo-300"
                />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-neutral-100 bg-neutral-50 p-5 text-sm text-neutral-700">
                {bio || "No bio added yet"}
              </div>
            )}
          </div>
        </MotionWrapper>

        <MotionWrapper>
          <div className="surface-card p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Skill Profile</h2>

            <p className="mb-6 mt-2 text-sm text-neutral-600">
              Your skills help match you with suitable events and teams.
            </p>

            <SkillSelector isEditing={isEditing} />
          </div>
        </MotionWrapper>

        <MotionWrapper>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className={`rounded-2xl px-6 py-3 text-white shadow-sm transition hover:scale-[1.02] ${
                isEditing
                  ? "bg-black"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600"
              }`}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>

            <div className="rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              {getCompletion()}% completed
            </div>
          </div>
        </MotionWrapper>

        <MotionWrapper>
          <div className="surface-card p-6 text-sm text-neutral-600">
            <p className="mb-3 font-medium text-neutral-800">Why skills matter</p>

            <ul className="list-disc space-y-1 pl-5">
              <li>Events match teams based on required skills</li>
              <li>Mentors can better evaluate team readiness</li>
              <li>Admins ensure structured participation</li>
            </ul>
          </div>
        </MotionWrapper>
      </div>

      {isCustomizerOpen ? (
        <AvatarCustomizerModal
          avatar={avatar}
          items={storeItems}
          ownedItemIds={ownedItemIds}
          coins={coins}
          busyItemId={busyItemId}
          onClose={() => setIsCustomizerOpen(false)}
          onSelect={handleAvatarSelect}
          onBuy={handleBuyItem}
          onAddCoins={handleAddCoins}
        />
      ) : null}
    </AppLayout>
  );
}
