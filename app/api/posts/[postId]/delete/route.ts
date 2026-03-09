import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const post = await prisma.skillRequestPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    /* DELETE DEPENDENCIES FIRST */

    await prisma.postInterest.deleteMany({
      where: { postId },
    });

    await prisma.postRequiredSkill.deleteMany({
      where: { postId },
    });

    /* DELETE POST */

    await prisma.skillRequestPost.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
