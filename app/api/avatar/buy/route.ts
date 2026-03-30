import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureUserAvatar } from "@/lib/avatar-server";
import { prisma } from "@/lib/prisma";

type BuyItemBody = {
  itemId?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as BuyItemBody;
    const itemId = body.itemId;

    if (!itemId) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    await ensureUserAvatar(session.user.id);

    const result = await prisma.$transaction(async (tx) => {
      const [user, item, existingPurchase] = await Promise.all([
        tx.user.findUnique({
          where: { id: session.user.id },
          select: { coins: true },
        }),
        tx.avatarItem.findUnique({
          where: { id: itemId },
        }),
        tx.userItem.findUnique({
          where: {
            userId_itemId: {
              userId: session.user.id,
              itemId,
            },
          },
        }),
      ]);

      if (!user) {
        return { error: "User not found", status: 404 as const };
      }

      if (!item) {
        return { error: "Item not found", status: 404 as const };
      }

      if (existingPurchase) {
        return { error: "Item already owned", status: 409 as const };
      }

      if (user.coins < item.price) {
        return { error: "Not enough coins", status: 400 as const };
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          coins: {
            decrement: item.price,
          },
        },
      });

      await tx.userItem.create({
        data: {
          userId: session.user.id,
          itemId: item.id,
        },
      });

      return { error: null, status: 200 as const };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        coins: true,
        userItems: {
          select: {
            itemId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      coins: refreshedUser?.coins ?? 0,
      ownedItemIds: refreshedUser?.userItems.map((entry) => entry.itemId) ?? [],
    });
  } catch (error) {
    console.error("BUY AVATAR ITEM ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
