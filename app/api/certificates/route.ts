import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CERTIFICATE_MAX_FILE_SIZE,
  getCertificateReward,
  isAllowedCertificateMimeType,
} from "@/lib/certificates";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const eventName = String(formData.get("eventName") ?? "").trim();
    const rawType = String(formData.get("type") ?? "").trim().toUpperCase();
    const file = formData.get("proofFile");

    if (!title || !eventName || !rawType || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Title, event name, type, and proof file are required." },
        { status: 400 },
      );
    }

    if (rawType !== "WON" && rawType !== "PARTICIPATED") {
      return NextResponse.json({ error: "Invalid certificate type." }, { status: 400 });
    }

    if (!isAllowedCertificateMimeType(file.type)) {
      return NextResponse.json(
        { error: "Only PDF, PNG, and JPEG files are allowed." },
        { status: 400 },
      );
    }

    if (file.size > CERTIFICATE_MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be 5MB or less." },
        { status: 400 },
      );
    }

    const matchedEvent = await prisma.event.findFirst({
      where: {
        title: {
          equals: eventName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
      },
    });

    const uploadDir = path.join(process.cwd(), "public", "uploads", "certificates");
    await mkdir(uploadDir, { recursive: true });

    const extension =
      path.extname(file.name) ||
      (file.type === "application/pdf"
        ? ".pdf"
        : file.type === "image/png"
          ? ".png"
          : ".jpg");
    const safeName = `${session.user.id}-${randomUUID()}${extension}`;
    const absolutePath = path.join(uploadDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    const coinsAwarded = getCertificateReward(rawType);

    const result = await prisma.$transaction(async (tx) => {
      const certificate = await tx.certificate.create({
        data: {
          userId: session.user.id,
          eventId: matchedEvent?.id ?? null,
          title,
          eventName: matchedEvent?.title ?? eventName,
          type: rawType,
          fileUrl: `/uploads/certificates/${safeName}`,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          isSkillVibeEvent: Boolean(matchedEvent),
          coinsAwarded,
        },
      });

      const user = await tx.user.update({
        where: { id: session.user.id },
        data: {
          coins: {
            increment: coinsAwarded,
          },
        },
        select: {
          coins: true,
        },
      });

      return { certificate, coins: user.coins };
    });

    return NextResponse.json(
      {
        success: true,
        certificate: result.certificate,
        coins: result.coins,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE CERTIFICATE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
