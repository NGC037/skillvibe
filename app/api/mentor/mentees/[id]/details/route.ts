import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMentorMenteeDetails } from "@/lib/mentor-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== Role.MENTOR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const details = await getMentorMenteeDetails(session.user.id, id);

    if (!details) {
      return NextResponse.json({ error: "Mentee not found" }, { status: 404 });
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error("GET MENTEE DETAILS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
