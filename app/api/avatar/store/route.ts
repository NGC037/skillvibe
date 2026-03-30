import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAvatarState } from "@/lib/avatar-server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, ownedItemIds, coins } = await getAvatarState(session.user.id);

    return NextResponse.json({
      items,
      ownedItemIds,
      coins,
    });
  } catch (error) {
    console.error("GET AVATAR STORE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
