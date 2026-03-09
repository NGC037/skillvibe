import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.skillRequestPost.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            year: true,
            division: true,
            linkedinUrl: true,
          },
        },

        event: {
          select: {
            id: true,
            title: true,
          },
        },

        requiredSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        interests: {
          select: {
            id: true,
          },
        },
      },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      description: post.description,
      createdAt: post.createdAt,

      event: post.event,

      creator: post.user,

      requiredSkills: post.requiredSkills.map((rs) => rs.skill),

      interestCount: post.interests.length,
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
    });

  } catch (error) {
    console.error("Fetch posts error:", error);

    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}