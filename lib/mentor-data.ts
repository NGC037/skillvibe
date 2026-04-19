import { prisma } from "@/lib/prisma";
import type {
  MenteeContributionRecord,
  MenteeEventRecord,
  MenteeLogRecord,
  MenteeProof,
  MentorMenteeDetails,
  MentorMenteeSummary,
  MentorWorkspaceTeam,
} from "@/lib/mentor-types";

type TeamWithWorkspace = Awaited<ReturnType<typeof fetchTeamsForMentorMentees>>[number];

function calculateCompletionPercentage(
  tasks: Array<{ status: string }>,
): number {
  if (tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  return Math.round((completedTasks / tasks.length) * 100);
}

function calculateContributionScore(tasksCompleted: number, logsCreated: number) {
  const effectiveLogs = Math.min(logsCreated, tasksCompleted + 2);
  return tasksCompleted * 10 + effectiveLogs * 3;
}

function getActivityLevel(score: number): "High" | "Moderate" | "Emerging" {
  if (score >= 80) {
    return "High";
  }

  if (score >= 30) {
    return "Moderate";
  }

  return "Emerging";
}

function serializeWorkspaceTeam(team: TeamWithWorkspace): MentorWorkspaceTeam {
  return {
    id: team.id,
    name: team.name,
    code: team.code,
    leaderId: team.leaderId,
    leader: {
      id: team.leader.id,
      name: team.leader.name,
      email: team.leader.email,
    },
    members: team.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      },
    })),
    project: team.project
      ? {
          id: team.project.id,
          title: team.project.title,
          tasks: team.project.tasks.map((task) => ({
            id: task.id,
            status: task.status,
            assignedToId: task.assignedToId,
          })),
          progressLogs: team.project.progressLogs.map((log) => ({
            id: log.id,
            userId: log.userId,
            createdAt: log.createdAt.toISOString(),
          })),
        }
      : null,
  };
}

async function fetchTeamsForMentorMentees(studentIds: string[]) {
  if (studentIds.length === 0) {
    return [];
  }

  return prisma.team.findMany({
    where: {
      OR: [
        { leaderId: { in: studentIds } },
        {
          members: {
            some: {
              userId: { in: studentIds },
            },
          },
        },
      ],
    },
    include: {
      event: true,
      leader: true,
      members: {
        include: {
          user: true,
        },
      },
      project: {
        include: {
          owner: true,
          tasks: true,
          progressLogs: {
            include: {
              user: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getMentorMentees(mentorId: string) {
  const mentees = await prisma.mentorMentee.findMany({
    where: { mentorId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          year: true,
          division: true,
          skills: {
            select: {
              id: true,
              level: true,
              endorsed: true,
              skill: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return mentees.map(
    (entry): MentorMenteeSummary => ({
      id: entry.student.id,
      name: entry.student.name,
      email: entry.student.email,
      department: entry.student.department,
      year: entry.student.year,
      division: entry.student.division,
      skills: entry.student.skills.map((skillEntry) => ({
        id: skillEntry.skill.id,
        name: skillEntry.skill.name,
        level: skillEntry.level,
        endorsed: skillEntry.endorsed,
      })),
    }),
  );
}

export async function getMentorWorkspaceTeams(mentorId: string) {
  const mentees = await prisma.mentorMentee.findMany({
    where: { mentorId },
    select: {
      studentId: true,
    },
  });

  const teams = await fetchTeamsForMentorMentees(
    mentees.map((entry) => entry.studentId),
  );

  return teams.map(serializeWorkspaceTeam);
}

export async function getMentorMenteeDetails(
  mentorId: string,
  menteeId: string,
): Promise<MentorMenteeDetails | null> {
  const relation = await prisma.mentorMentee.findFirst({
    where: {
      mentorId,
      studentId: menteeId,
    },
  });

  if (!relation) {
    return null;
  }

  const mentee = await prisma.user.findUnique({
    where: {
      id: menteeId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      year: true,
      division: true,
      bio: true,
      linkedinUrl: true,
      githubUrl: true,
      portfolioUrl: true,
      skills: {
        select: {
          level: true,
          endorsed: true,
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      participations: {
        include: {
          event: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!mentee) {
    return null;
  }

  const rawWorkspaceTeams = await fetchTeamsForMentorMentees([menteeId]);
  const workspaceTeams = rawWorkspaceTeams.filter(
    (team) =>
      team.leaderId === menteeId ||
      team.members.some((member) => member.userId === menteeId),
  );

  const workspaceTeamsByEventId = new Map(
    workspaceTeams.map((team) => [team.eventId, team]),
  );

  const rankedEventTeams = await prisma.team.findMany({
    where: {
      eventId: {
        in: mentee.participations.map((participation) => participation.eventId),
      },
    },
    include: {
      project: {
        include: {
          tasks: true,
          progressLogs: true,
        },
      },
    },
  });

  const topTeamByEventId = new Map<
    string,
    { teamId: string; score: number; totalTeams: number }
  >();

  for (const participation of mentee.participations) {
    const teamsForEvent = rankedEventTeams.filter(
      (team) => team.eventId === participation.eventId,
    );

    const rankedTeams = teamsForEvent
      .map((team) => {
        const tasks = team.project?.tasks ?? [];
        const logs = team.project?.progressLogs ?? [];
        const completion = calculateCompletionPercentage(tasks);
        const score = completion + Math.max(1, logs.length);

        return {
          teamId: team.id,
          score,
        };
      })
      .sort((left, right) => right.score - left.score);

    if (rankedTeams[0]) {
      topTeamByEventId.set(participation.eventId, {
        teamId: rankedTeams[0].teamId,
        score: rankedTeams[0].score,
        totalTeams: teamsForEvent.length,
      });
    }
  }

  const proofs: MenteeProof[] = [];

  if (mentee.linkedinUrl) {
    proofs.push({
      id: `${mentee.id}-linkedin`,
      title: "LinkedIn profile",
      url: mentee.linkedinUrl,
      kind: "LINK",
      source: "Profile",
    });
  }

  if (mentee.githubUrl) {
    proofs.push({
      id: `${mentee.id}-github`,
      title: "GitHub profile",
      url: mentee.githubUrl,
      kind: "LINK",
      source: "Profile",
    });
  }

  if (mentee.portfolioUrl) {
    proofs.push({
      id: `${mentee.id}-portfolio`,
      title: "Portfolio",
      url: mentee.portfolioUrl,
      kind: "LINK",
      source: "Profile",
    });
  }

  const events: MenteeEventRecord[] = mentee.participations.map((participation) => {
    const team = workspaceTeamsByEventId.get(participation.eventId) ?? null;
    const completion = calculateCompletionPercentage(team?.project?.tasks ?? []);
    const eventHasLink = Boolean(participation.event.externalLink);

    if (participation.event.externalLink) {
      proofs.push({
        id: `${participation.id}-event-link`,
        title: `${participation.event.title} reference`,
        url: participation.event.externalLink,
        kind: "LINK",
        source: "Event",
        eventTitle: participation.event.title,
      });
    }

    const topTeam = topTeamByEventId.get(participation.eventId);
    const inferredWin =
      Boolean(team) &&
      Boolean(topTeam) &&
      topTeam?.teamId === team?.id &&
      (topTeam?.totalTeams ?? 0) > 1 &&
      (topTeam?.score ?? 0) > 1;

    return {
      id: participation.event.id,
      title: participation.event.title,
      status: participation.status,
      participatedAt: participation.createdAt.toISOString(),
      externalLink: participation.event.externalLink,
      teamId: team?.id ?? null,
      teamName: team?.name ?? team?.code ?? null,
      workspaceCompletion: completion,
      proofCount: eventHasLink ? 1 : 0,
      isWinner: inferredWin,
      winLabel: inferredWin ? "Top workspace score in event cohort" : null,
      winConfidence: inferredWin ? "inferred" : "none",
    };
  });

  const contributions: MenteeContributionRecord[] = workspaceTeams
    .filter((team) => team.project)
    .map((team) => {
      const project = team.project;
      const tasksCompleted = project?.tasks.filter(
        (task) => task.assignedToId === menteeId && task.status === "DONE",
      ).length ?? 0;
      const logsCreated = project?.progressLogs.filter(
        (log) => log.userId === menteeId,
      ).length ?? 0;

      return {
        projectId: project!.id,
        projectTitle: project!.title,
        teamId: team.id,
        teamName: team.name ?? team.code,
        tasksCompleted,
        logsCreated,
        score: calculateContributionScore(tasksCompleted, logsCreated),
      };
    })
    .sort((left, right) => right.score - left.score);

  const logs: MenteeLogRecord[] = workspaceTeams
    .flatMap((team) =>
      (team.project?.progressLogs ?? [])
        .filter((log) => log.userId === menteeId)
        .map((log) => ({
          id: log.id,
          content: log.content,
          createdAt: log.createdAt.toISOString(),
          teamId: team.id,
          teamName: team.name ?? team.code,
          projectId: team.project!.id,
          projectTitle: team.project!.title,
        })),
    )
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const wins = events.filter((event) => event.isWinner);
  const totalTasksCompleted = contributions.reduce(
    (sum, contribution) => sum + contribution.tasksCompleted,
    0,
  );
  const totalLogsCreated = contributions.reduce(
    (sum, contribution) => sum + contribution.logsCreated,
    0,
  );
  const totalContributionScore = contributions.reduce(
    (sum, contribution) => sum + contribution.score,
    0,
  );

  return {
    mentee: {
      id: mentee.id,
      name: mentee.name,
      email: mentee.email,
      department: mentee.department,
      year: mentee.year,
      division: mentee.division,
      bio: mentee.bio,
      linkedinUrl: mentee.linkedinUrl,
      githubUrl: mentee.githubUrl,
      portfolioUrl: mentee.portfolioUrl,
      skills: mentee.skills.map((skillEntry) => ({
        id: skillEntry.skill.id,
        name: skillEntry.skill.name,
        level: skillEntry.level,
        endorsed: skillEntry.endorsed,
      })),
    },
    overview: {
      totalEvents: events.length,
      winsCount: wins.length,
      proofCount: proofs.length,
      contributionScore: totalContributionScore,
      tasksCompleted: totalTasksCompleted,
      logsCreated: totalLogsCreated,
      activityLevel: getActivityLevel(totalContributionScore),
    },
    events,
    wins,
    proofs,
    contributions,
    logs,
    workspaces: workspaceTeams.map(serializeWorkspaceTeam),
  };
}
