import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  message: string,
  options?: {
    type?: string;
    requestId?: string;
  },
) {
  return prisma.notification.create({
    data: {
      userId,
      message,
      type: options?.type ?? null,
      requestId: options?.requestId ?? null,
    },
  });
}
