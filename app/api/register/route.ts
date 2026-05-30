import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Use /api/users/register for validated registration." },
    { status: 410 },
  );
}
