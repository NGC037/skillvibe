import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  _req: Request,
  context: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    console.log("SESSION:", session);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await context.params;

    // Check if already interested
    const existing = await prisma.postInterest.findFirst({
      where: {
        postId: postId,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already interested",
      });
    }

    // Create interest
    await prisma.postInterest.create({
      data: {
        post: {
          connect: { id: postId },
        },
        user: {
          connect: { id: session.user.id },
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Interest error:", error);

    return NextResponse.json(
      { error: "Failed to register interest" },
      { status: 500 },
    );
  }
}
