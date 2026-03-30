import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensureUserAvatar, verifyOwnedItem } from "@/lib/avatar-server";
import { getAvatarItemType } from "@/lib/avatar";
import { prisma } from "@/lib/prisma";

type UpdateAvatarBody = {
  hair?: string;
  outfit?: string;
  accessory?: string | null;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateAvatarBody;
    const updates: Record<string, string | null> = {};

    await ensureUserAvatar(session.user.id);

    for (const key of ["hair", "outfit", "accessory"] as const) {
      const nextValue = body[key];

      if (nextValue === undefined) {
        continue;
      }

      if (key === "accessory" && nextValue === null) {
        updates[key] = null;
        continue;
      }

      if (typeof nextValue !== "string" || !nextValue) {
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      }

      const itemType = getAvatarItemType(key);

      if (!itemType) {
        return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
      }

      const ownership = await verifyOwnedItem(session.user.id, nextValue, itemType);

      if (!ownership.ok) {
        return NextResponse.json({ error: ownership.reason }, { status: 403 });
      }

      updates[key] = nextValue;
    }

    const avatar = await prisma.avatar.update({
      where: { userId: session.user.id },
      data: updates,
    });

    return NextResponse.json({ avatar });
  } catch (error) {
    console.error("UPDATE AVATAR ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
