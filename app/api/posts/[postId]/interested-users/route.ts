import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
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
      include: {
        requiredSkills: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const requiredSkillIds = post.requiredSkills.map((s) => s.skillId);

    const interests = await prisma.postInterest.findMany({
      where: { postId },
      include: {
        user: {
          include: {
            skills: {
              include: {
                skill: true,
              },
            },
          },
        },
      },
    });

    const users = interests.map((interest) => {
      const userSkillIds = interest.user.skills.map((s) => s.skillId);

      const matchedSkills = userSkillIds.filter((id) =>
        requiredSkillIds.includes(id),
      );

      const matchScore =
        requiredSkillIds.length === 0
          ? 0
          : Math.round((matchedSkills.length / requiredSkillIds.length) * 100);

      return {
        id: interest.user.id,
        name: interest.user.name,
        email: interest.user.email,
        department: interest.user.department,
        division: interest.user.division,
        year: interest.user.year,
        linkedinUrl: interest.user.linkedinUrl,
        githubUrl: interest.user.githubUrl,
        portfolioUrl: interest.user.portfolioUrl,
        matchScore,
        skills: interest.user.skills.map((s) => s.skill),
      };
    });

    // Sort candidates by match score
    users.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Candidates error:", error);

    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 },
    );
  }
}
