import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/requireRole";
import { Role } from "@prisma/client";

export async function GET() {
  const { error } = await requireRole([Role.ADMIN]);
  if (error) return error;

  const hashedPassword = await bcrypt.hash("123456", 10);

  const users = await prisma.user.createMany({
    data: [
      {
        name: "UserTwo",
        email: "user2@test.com",
        password: hashedPassword,
        role: "STUDENT",
      },
      {
        name: "UserThree",
        email: "user3@test.com",
        password: hashedPassword,
        role: "STUDENT",
      },
      {
        name: "UserFour",   // ✅ New user added
        email: "user4@test.com",
        password: hashedPassword,
        role: "STUDENT",
      },
    ],
  });

  return NextResponse.json(users);
}
