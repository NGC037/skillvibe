import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get("department")?.trim();

    if (!department) {
      return NextResponse.json({ mentors: [] });
    }

    const mentors = await prisma.user.findMany({
      where: {
        role: Role.MENTOR,
        department,
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ mentors });
  } catch (error) {
    console.error("GET MENTORS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

