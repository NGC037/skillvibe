import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const body = await req.json();
    const { title, description } = body;

    const post = await prisma.skillRequestPost.findUnique({
      where: { id: postId },
    });

    if (!post || post.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updated = await prisma.skillRequestPost.update({
      where: { id: postId },
      data: {
        title,
        description,
      },
    });

    return NextResponse.json({
      success: true,
      post: updated,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}
