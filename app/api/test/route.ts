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
    console.error(error);
    return NextResponse.json({ success: false });
  }
}

export async function POST(request: Request) {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  try {
    const body = await request.json();
    const { name } = body;

    const skill = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    return NextResponse.json({ success: true, skill });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false });
  }
}
