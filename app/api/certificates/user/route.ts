import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCertificateCategory } from "@/lib/certificates";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, certificates] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          coins: true,
        },
      }),
      prisma.certificate.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return NextResponse.json({
      coins: user?.coins ?? 0,
      certificates: certificates.map((certificate) => ({
        ...certificate,
        category: getCertificateCategory({
          type: certificate.type,
          isSkillVibeEvent: certificate.isSkillVibeEvent,
        }),
      })),
    });
  } catch (error) {
    console.error("GET CERTIFICATES ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
