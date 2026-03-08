import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import EditEventForm from "@/components/admin/EditEventForm";

export default async function EditEventPage(props: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/api/auth/signin");
  if (session.user.role !== Role.ADMIN) redirect("/dashboard");

  const { eventId } = await props.params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventSkills: {
        include: { skill: true },
      },
    },
  });

  if (!event) redirect("/admin");

  const allSkills = await prisma.skill.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <EditEventForm
      event={event}
      allSkills={allSkills}
    />
  );
}