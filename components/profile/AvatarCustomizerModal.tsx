"use client";

import { useMemo, useState } from "react";
import AvatarPreview from "@/components/profile/AvatarPreview";

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

type AvatarCustomizerModalProps = {
  avatar: Avatar;
  items: StoreItem[];
  ownedItemIds: string[];
  coins: number;
  busyItemId: string | null;
  onClose: () => void;
  onSelect: (type: "hair" | "outfit" | "accessory", itemId: string | null) => void;
  onBuy: (itemId: string) => void;
  onAddCoins: (amount: number) => void;
};

const tabs = [
  { id: "hair", label: "Hair" },
  { id: "outfit", label: "Outfit" },
  { id: "accessory", label: "Accessories" },
] as const;

export default function AvatarCustomizerModal({
  avatar,
  items,
  ownedItemIds,
  coins,
  busyItemId,
  onClose,
  onSelect,
  onBuy,
  onAddCoins,
}: AvatarCustomizerModalProps) {
  const [activeTab, setActiveTab] = useState<"hair" | "outfit" | "accessory">("hair");

  const visibleItems = useMemo(
    () => items.filter((item) => item.type === activeTab),
    [activeTab, items],
  );

  const equippedItemId =
    activeTab === "hair"
      ? avatar.hair
      : activeTab === "outfit"
        ? avatar.outfit
        : avatar.accessory;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/55 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto bg-white/95 rounded-3xl shadow-2xl border border-white/70 overflow-hidden backdrop-blur-xl">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex justify-between items-start gap-4">
          <div>
            <p className="text-sm text-white/80">Avatar Workshop</p>
            <h2 className="text-2xl font-semibold">Customize your look</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onAddCoins(25)}
              className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/20 text-sm"
            >
              Add 25 Coins
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-white text-indigo-700 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-0">
          <div className="bg-gradient-to-b from-neutral-50 to-white border-r border-neutral-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-600">Preview</p>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                {coins} Coins
              </span>
            </div>

            <div className="flex justify-center">
              <AvatarPreview
                base={avatar.base}
                hair={avatar.hair}
                outfit={avatar.outfit}
                accessory={avatar.accessory}
              />
            </div>

            <div className="surface-card p-4 text-sm text-neutral-600">
              Owned items: {ownedItemIds.length}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {activeTab === "accessory" ? (
                <button
                  type="button"
                  onClick={() => onSelect("accessory", null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    avatar.accessory === null
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  Remove Accessory
                </button>
              ) : null}
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleItems.map((item) => {
                const isOwned = ownedItemIds.includes(item.id);
                const isEquipped = equippedItemId === item.id;
                const cannotAfford = coins < item.price;
                const isBusy = busyItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`interactive-card border rounded-2xl p-4 shadow-sm transition ${
                      isEquipped ? "border-indigo-300 bg-indigo-50/60" : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div
                      className="aspect-square rounded-2xl overflow-hidden bg-neutral-100 mb-4 bg-cover bg-center"
                      aria-label={item.name}
                      role="img"
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />

                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900">{item.name}</p>
                          <p className="text-sm text-neutral-500 capitalize">{item.type}</p>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                          {item.price} Coins
                        </span>
                      </div>

                      {isOwned ? (
                        <button
                          type="button"
                          onClick={() => onSelect(item.type, item.id)}
                          disabled={isEquipped}
                          className={`w-full px-4 py-2 rounded-xl text-sm font-medium ${
                            isEquipped
                              ? "bg-neutral-900 text-white cursor-default"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white"
                          }`}
                        >
                          {isEquipped ? "Equipped" : "Equip"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onBuy(item.id)}
                          disabled={cannotAfford || isBusy}
                          className={`w-full px-4 py-2 rounded-xl text-sm font-medium ${
                            cannotAfford || isBusy
                              ? "bg-neutral-200 text-neutral-500 cursor-not-allowed"
                              : "bg-neutral-900 hover:bg-black text-white"
                          }`}
                        >
                          {isBusy ? "Buying..." : cannotAfford ? "Not enough coins" : "Buy"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
