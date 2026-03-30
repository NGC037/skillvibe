export const DEFAULT_AVATAR = {
  base: "base_default",
  hair: "hair_default",
  outfit: "outfit_default",
  accessory: null as string | null,
};

export const AVATAR_ITEM_TYPES = ["hair", "outfit", "accessory"] as const;

export type AvatarItemType = (typeof AVATAR_ITEM_TYPES)[number];

export const AVATAR_ITEMS = [
  {
    id: "hair_default",
    name: "Short Black Hair",
    type: "hair",
    imageUrl:
      "https://via.placeholder.com/150/1f2937/ffffff?text=Short+Black+Hair",
    price: 0,
  },
  {
    id: "hair_curly",
    name: "Curly Hair",
    type: "hair",
    imageUrl: "https://via.placeholder.com/150/7c3aed/ffffff?text=Curly+Hair",
    price: 10,
  },
  {
    id: "outfit_default",
    name: "Basic Hoodie",
    type: "outfit",
    imageUrl:
      "https://via.placeholder.com/150/2563eb/ffffff?text=Basic+Hoodie",
    price: 0,
  },
  {
    id: "outfit_formal",
    name: "Formal Outfit",
    type: "outfit",
    imageUrl:
      "https://via.placeholder.com/150/0f172a/ffffff?text=Formal+Outfit",
    price: 20,
  },
  {
    id: "accessory_glasses",
    name: "Glasses",
    type: "accessory",
    imageUrl:
      "https://via.placeholder.com/150/be123c/ffffff?text=Glasses",
    price: 5,
  },
] as const;

export type AvatarItemSeed = (typeof AVATAR_ITEMS)[number];

export function getAvatarItemType(value: string): AvatarItemType | null {
  if ((AVATAR_ITEM_TYPES as readonly string[]).includes(value)) {
    return value as AvatarItemType;
  }

  return null;
}

export function getAvatarLayerStyle(itemId: string | null | undefined) {
  switch (itemId) {
    case "hair_default":
      return "bg-slate-800 top-5 left-9 right-9 h-10 rounded-t-[2rem] rounded-b-xl opacity-95";
    case "hair_curly":
      return "bg-violet-500 top-4 left-7 right-7 h-12 rounded-[2rem] opacity-90";
    case "outfit_default":
      return "bg-blue-500 bottom-5 left-8 right-8 h-14 rounded-t-3xl rounded-b-xl opacity-90";
    case "outfit_formal":
      return "bg-slate-900 bottom-5 left-8 right-8 h-14 rounded-t-3xl rounded-b-xl opacity-95";
    case "accessory_glasses":
      return "border-[6px] border-rose-600 top-[4.6rem] left-10 right-10 h-5 rounded-full";
    default:
      return "";
  }
}

export function getAvatarLabel(itemId: string | null | undefined) {
  if (!itemId) {
    return "";
  }

  const item = AVATAR_ITEMS.find((entry) => entry.id === itemId);
  return item?.name ?? itemId;
}
