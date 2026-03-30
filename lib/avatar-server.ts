import { prisma } from "@/lib/prisma";
import { AVATAR_ITEMS, DEFAULT_AVATAR, type AvatarItemType } from "@/lib/avatar";

function assertAvatarClient() {
  if (!prisma.avatarItem) {
    throw new Error("Prisma client not updated. Run prisma generate.");
  }
}

export async function ensureAvatarCatalog() {
  assertAvatarClient();

  await Promise.all(
    AVATAR_ITEMS.map((item) =>
      prisma.avatarItem.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          type: item.type,
          imageUrl: item.imageUrl,
          price: item.price,
        },
        create: {
          id: item.id,
          name: item.name,
          type: item.type,
          imageUrl: item.imageUrl,
          price: item.price,
        },
      }),
    ),
  );
}

export async function ensureOwnedDefaultItems(userId: string) {
  const defaultItems = AVATAR_ITEMS.filter((item) => item.price === 0);

  await Promise.all(
    defaultItems.map((item) =>
      prisma.userItem.upsert({
        where: {
          userId_itemId: {
            userId,
            itemId: item.id,
          },
        },
        update: {},
        create: {
          userId,
          itemId: item.id,
        },
      }),
    ),
  );
}

export async function ensureUserAvatar(userId: string) {
  await ensureAvatarCatalog();
  await ensureOwnedDefaultItems(userId);

  return prisma.avatar.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...DEFAULT_AVATAR,
    },
  });
}

export async function getAvatarState(userId: string) {
  assertAvatarClient();
  await ensureUserAvatar(userId);

  const [avatar, user, items] = await Promise.all([
    prisma.avatar.findUnique({
      where: { userId },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        coins: true,
        userItems: {
          select: {
            itemId: true,
          },
        },
      },
    }),
    prisma.avatarItem.findMany({
      orderBy: [{ price: "asc" }, { name: "asc" }],
    }),
  ]);

  return {
    avatar,
    coins: user?.coins ?? 0,
    ownedItemIds: user?.userItems.map((entry) => entry.itemId) ?? [],
    items,
  };
}

export async function verifyOwnedItem(
  userId: string,
  itemId: string,
  type: AvatarItemType,
) {
  assertAvatarClient();

  const item = await prisma.avatarItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      type: true,
    },
  });

  if (!item || item.type !== type) {
    return { ok: false as const, reason: "Invalid item" };
  }

  const ownership = await prisma.userItem.findUnique({
    where: {
      userId_itemId: {
        userId,
        itemId,
      },
    },
  });

  if (!ownership) {
    return { ok: false as const, reason: "Item not owned" };
  }

  return { ok: true as const };
}
