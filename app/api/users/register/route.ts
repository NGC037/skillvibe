import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {

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
    linkedin
  } = body;

  if (!name || !email || !password) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {

      name,
      email,
      password: hashed,

      role: role ?? Role.STUDENT,

      studentId: studentId ?? null,
      mentorId: mentorId ?? null,
      adminId: adminId ?? null,

      department: department ?? null,
      year: year ? Number(year) : null,
      linkedinUrl: linkedin ?? null
    }
  });

  return Response.json({
    success: true,
    user
  });

}