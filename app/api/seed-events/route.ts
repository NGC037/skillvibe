import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await prisma.event.createMany({
    data: [
      {
        title: "Hackathon 2026",
        description: "24-hour innovation challenge",
        minTeamSize: 2,
        maxTeamSize: 4,
      },
      {
        title: "AI Innovation Challenge",
        description: "Build AI solutions",
        minTeamSize: 1,
        maxTeamSize: 3,
      },
    ],
    skipDuplicates: true,
  });

  return NextResponse.json({
    success: true,
    message: "Events seeded successfully",
  });
}
