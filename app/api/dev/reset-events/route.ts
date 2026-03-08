import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Delete in correct order (respecting relations)

    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.participation.deleteMany();
    await prisma.eventSkill.deleteMany();
    await prisma.event.deleteMany();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("RESET EVENTS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to reset events" },
      { status: 500 }
    );
  }
}