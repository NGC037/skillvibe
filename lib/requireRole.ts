import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function requireRole(allowedRoles: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
      session: null,
    };
  }

  if (!allowedRoles.includes(session.user.role as Role)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}