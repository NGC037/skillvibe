import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const requestIds = notifications
      .filter(
        (notification) =>
          notification.type === "TEAM_REQUEST" && typeof notification.requestId === "string",
      )
      .map((notification) => notification.requestId as string);

    const pendingRequests = requestIds.length
      ? await prisma.teamJoinRequest.findMany({
          where: {
            id: { in: requestIds },
            status: "PENDING",
          },
          select: {
            id: true,
          },
        })
      : [];

    const pendingRequestIds = new Set(pendingRequests.map((request) => request.id));

    const hydratedNotifications = notifications.map((notification) => ({
      ...notification,
      actionable:
        notification.type === "TEAM_REQUEST" && notification.requestId
          ? pendingRequestIds.has(notification.requestId)
          : false,
    }));

    const unreadCount = notifications.filter((notification) => !notification.read).length;

    return NextResponse.json({
      notifications: hydratedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
