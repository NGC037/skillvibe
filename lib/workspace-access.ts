import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type WorkspaceAccess = {
  user: {
    id: string;
    email: string;
    role: Role;
    name: string | null;
  };
  project: {
    id: string;
    title: string;
    team: {
      id: string;
      name: string | null;
      leaderId: string;
      members: Array<{
        id: string;
        userId: string;
        user: {
          id: string;
          name: string | null;
          email: string;
        };
      }>;
      leader: {
        id: string;
        name: string | null;
        email: string;
      };
    };
  };
  isLeader: boolean;
  isAdmin: boolean;
  isMember: boolean;
};

export async function getWorkspaceAccessByProjectId(
  email: string,
  projectId: string,
): Promise<WorkspaceAccess | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      title: true,
      team: {
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project?.team) {
    return null;
  }

  const isLeader = project.team.leaderId === user.id;
  const isAdmin = user.role === Role.ADMIN;
  const isMember =
    isLeader ||
    project.team.members.some((member) => member.userId === user.id);

  if (!isMember && !isAdmin) {
    return null;
  }

  return {
    user,
    project: {
      id: project.id,
      title: project.title,
      team: project.team,
    },
    isLeader,
    isAdmin,
    isMember,
  };
}

export async function getWorkspaceAccessByTaskId(
  email: string,
  taskId: string,
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      assignedToId: true,
      status: true,
      projectId: true,
    },
  });

  if (!task) {
    return null;
  }

  const access = await getWorkspaceAccessByProjectId(email, task.projectId);

  if (!access) {
    return null;
  }

  return {
    ...access,
    task,
  };
}

export function checkTaskOwnership(access: NonNullable<Awaited<ReturnType<typeof getWorkspaceAccessByTaskId>>>) {
  return (
    access.isLeader ||
    access.isAdmin ||
    access.task.assignedToId === access.user.id
  );
}

export function getAssignableMembers(access: WorkspaceAccess) {
  const uniqueMembers = [
    {
      id: access.project.team.leader.id,
      name: access.project.team.leader.name,
      email: access.project.team.leader.email,
    },
    ...access.project.team.members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
    })),
  ].filter(
    (member, index, list) =>
      list.findIndex((entry) => entry.id === member.id) === index,
  );

  return uniqueMembers;
}
