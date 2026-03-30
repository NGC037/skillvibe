import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function isValidOptionalUrl(value: string | undefined) {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      email,
      password,
      role,
      studentId,
      mentorId,
      adminId,
      department,
      year,
      division,
      linkedin,
      githubUrl,
      portfolioUrl,
    } = body;

    if (!name || !email || !password) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!department) {
      return Response.json(
        { error: "Department required" },
        { status: 400 },
      );
    }

    if (
      !isValidOptionalUrl(linkedin) ||
      !isValidOptionalUrl(githubUrl) ||
      !isValidOptionalUrl(portfolioUrl)
    ) {
      return Response.json(
        { error: "Please enter valid URLs" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return Response.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const normalizedRole = role ?? Role.STUDENT;

    if (normalizedRole === Role.STUDENT) {
      if (!mentorId) {
        return Response.json(
          { error: "Please select a mentor" },
          { status: 400 },
        );
      }

    }

    const user = await prisma.$transaction(async (tx) => {
      let selectedMentor: { id: string; department: string | null } | null = null;

      if (normalizedRole === Role.STUDENT) {
        selectedMentor = await tx.user.findFirst({
          where: {
            id: mentorId,
            role: Role.MENTOR,
          },
          select: {
            id: true,
            department: true,
          },
        });

        if (!selectedMentor) {
          throw new Error("MENTOR_NOT_FOUND");
        }

        if (selectedMentor.department && department && selectedMentor.department !== department) {
          throw new Error("MENTOR_DEPARTMENT_MISMATCH");
        }
      }

      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashed,
          role: normalizedRole,
          studentId: studentId ?? null,
          mentorId: normalizedRole === Role.MENTOR ? mentorId ?? null : null,
          adminId: adminId ?? null,
          department: department ?? null,
          year: year ? Number(year) : null,
          division: division ?? null,
          linkedinUrl: linkedin ?? null,
          githubUrl: githubUrl ?? null,
          portfolioUrl: portfolioUrl ?? null,
        },
      });

      if (normalizedRole === Role.STUDENT && selectedMentor) {
        const existingAssignment = await tx.mentorMentee.findUnique({
          where: { studentId: createdUser.id },
          select: { id: true },
        });

        if (existingAssignment) {
          throw new Error("STUDENT_ALREADY_ASSIGNED");
        }

        await tx.mentorMentee.create({
          data: {
            mentorId: selectedMentor.id,
            studentId: createdUser.id,
          },
        });
      }

      return createdUser;
    });

    return Response.json({
      success: true,
      user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "MENTOR_NOT_FOUND") {
        return Response.json({ error: "Selected mentor was not found" }, { status: 404 });
      }

      if (error.message === "MENTOR_DEPARTMENT_MISMATCH") {
        return Response.json(
          { error: "Selected mentor must belong to the same department" },
          { status: 400 },
        );
      }

      if (error.message === "STUDENT_ALREADY_ASSIGNED") {
        return Response.json(
          { error: "Student is already assigned to a mentor" },
          { status: 409 },
        );
      }
    }

    console.error("REGISTER USER ERROR:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
