import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCertificateCategory } from "@/lib/certificates";

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
        department: true,
        division: true,
        year: true,
        bio: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
        coins: true,
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
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                posterUrl: true,
                registrationStartDate: true,
                registrationEndDate: true,
              },
            },
          },
        },
        certificates: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            title: true,
            eventName: true,
            type: true,
            fileUrl: true,
            createdAt: true,
            coinsAwarded: true,
            isSkillVibeEvent: true,
            event: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
              },
            },
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

    const events = user.participations.map((participation) => ({
      id: participation.event.id,
      participationId: participation.id,
      title: participation.event.title,
      description: participation.event.description,
      posterUrl: participation.event.posterUrl,
      registrationStartDate: participation.event.registrationStartDate,
      registrationEndDate: participation.event.registrationEndDate,
      status: participation.status,
      participatedAt: participation.createdAt,
    }));

    const wins = user.certificates
      .filter((certificate) => certificate.type === "WON")
      .map((certificate) => ({
        id: certificate.id,
        title: certificate.title,
        eventName: certificate.eventName,
        createdAt: certificate.createdAt,
        posterUrl: certificate.event?.posterUrl ?? null,
      }));

    const certificates = user.certificates.map((certificate) => ({
      id: certificate.id,
      title: certificate.title,
      eventName: certificate.eventName,
      type: certificate.type,
      fileUrl: certificate.fileUrl,
      createdAt: certificate.createdAt,
      coinsAwarded: certificate.coinsAwarded,
      isSkillVibeEvent: certificate.isSkillVibeEvent,
      category: getCertificateCategory({
        type: certificate.type,
        isSkillVibeEvent: certificate.isSkillVibeEvent,
      }),
    }));

    return NextResponse.json({
      ...user,
      events,
      wins,
      certificates,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
