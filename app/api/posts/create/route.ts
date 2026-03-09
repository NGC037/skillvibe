import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    message: "Skill request post API working",
  });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, eventId, skillIds } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description required" },
        { status: 400 }
      );
    }

    const post = await prisma.skillRequestPost.create({
      data: {
        title,
        description,
        user: {
          connect: { id: session.user.id },
        },
        ...(eventId && {
          event: {
            connect: { id: eventId },
          },
        }),
      },
    });

    if (Array.isArray(skillIds) && skillIds.length > 0) {
      await prisma.postRequiredSkill.createMany({
        data: skillIds.map((skillId: string) => ({
          postId: post.id,
          skillId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      post,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}