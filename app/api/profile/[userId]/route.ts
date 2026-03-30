import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        avatar: {
          select: {
            base: true,
            hair: true,
            outfit: true,
            accessory: true,
          },
        },
        skills: {
          select: {
            level: true,
            endorsed: true,
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        teamMembers: {
          select: {
            id: true,
          },
        },
        participations: {
          select: {
            id: true,
            status: true,
          },
        },
        projects: {
          select: {
            id: true,
            title: true,
            shortDescription: true,
            fullDescription: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
