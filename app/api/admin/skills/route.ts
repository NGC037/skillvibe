import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/requireRole";
import { Role } from "@prisma/client";

export async function GET() {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, skills });
  } catch (error) {
    console.error("ADMIN FETCH SKILLS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}