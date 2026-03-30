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

    const { avatar, coins, ownedItemIds } = await getAvatarState(session.user.id);

    return NextResponse.json({
      avatar,
      coins,
      ownedItemIds,
    });
  } catch (error) {
    console.error("GET AVATAR ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
