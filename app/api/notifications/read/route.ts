import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const notificationId =
      typeof body.notificationId === "string" ? body.notificationId : null;

    if (notificationId) {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
        data: {
          read: true,
        },
      });
    } else {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("READ NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
