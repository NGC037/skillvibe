import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AddCoinsBody = {
  amount?: number;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as AddCoinsBody;
    const amount = Number(body.amount ?? 0);

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        coins: {
          increment: amount,
        },
      },
      select: {
        coins: true,
      },
    });

    return NextResponse.json({
      success: true,
      coins: user.coins,
    });
  } catch (error) {
    console.error("ADD COINS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
