import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWorkspaceAccessByProjectId } from "@/lib/workspace-access";

function buildInsights({
  completionPercentage,
  unassignedTasks,
  logsCount,
  topContributor,
}: {
  completionPercentage: number;
  unassignedTasks: number;
  logsCount: number;
  topContributor: string;
}) {
  const insights: string[] = [];

  if (completionPercentage >= 80) {
    insights.push("Delivery momentum is strong and the team is close to completion.");
  } else if (completionPercentage >= 40) {
    insights.push("Execution is moving, but task closure needs another push to reach the finish line.");
  } else {
    insights.push("Delivery risk is elevated because completed work is still low compared with total planned tasks.");
  }

  if (unassignedTasks > 0) {
    insights.push(`${unassignedTasks} task(s) are still unassigned and should be distributed soon.`);
  } else {
    insights.push("All current tasks are assigned to accountable owners.");
  }

  if (logsCount < 3) {
    insights.push("Progress logging is light, so reporting quality can improve with more frequent updates.");
  } else {
    insights.push("Log coverage is healthy enough to track execution progress with confidence.");
  }

  insights.push(`Current top contributor: ${topContributor}.`);

  return insights;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { teamId },
      include: {
        owner: true,
        team: {
          include: {
            event: true,
            leader: true,
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        progressLogs: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project || !project.team) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const access = await getWorkspaceAccessByProjectId(
      session.user.email,
      project.id,
    );

    if (!access) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const members = [
      {
        id: project.team.leader.id,
        name: project.team.leader.name,
        email: project.team.leader.email,
        role: "Leader",
      },
      ...project.team.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: "Member",
      })),
    ].filter(
      (member, index, list) =>
        list.findIndex((entry) => entry.id === member.id) === index,
    );

    const tasks = access.isLeader || access.isAdmin
      ? project.tasks
      : project.tasks.filter((task) => task.assignedToId === access.user.id);

    const logs = access.isLeader || access.isAdmin
      ? project.progressLogs
      : project.progressLogs.filter((log) => log.userId === access.user.id);

    const contributionBreakdown = members.map((member) => {
      const tasksCompleted = project.tasks.filter(
        (task) => task.assignedToId === member.id && task.status === "DONE",
      ).length;
      const tasksAssigned = project.tasks.filter(
        (task) => task.assignedToId === member.id,
      ).length;
      const logsCreated = project.progressLogs.filter(
        (log) => log.userId === member.id,
      ).length;
      const score = tasksCompleted * 10 + Math.min(logsCreated, tasksCompleted + 2) * 3;

      return {
        memberName: member.name || member.email,
        memberEmail: member.email,
        role: member.role,
        tasksAssigned,
        tasksCompleted,
        logsCreated,
        score,
      };
    }).sort((a, b) => b.score - a.score);

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((task) => task.status === "DONE").length;
    const inProgressTasks = project.tasks.filter((task) => task.status === "IN_PROGRESS").length;
    const todoTasks = project.tasks.filter((task) => task.status === "TODO").length;
    const unassignedTasks = project.tasks.filter((task) => !task.assignedToId).length;
    const completionPercentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const report = {
      title: `${project.title} Workspace Report`,
      generatedAt: new Date().toISOString(),
      teamInfo: {
        teamName: project.team.name || project.team.code,
        teamCode: project.team.code,
        eventTitle: project.team.event?.title || "No linked event",
        projectTitle: project.title,
        shortDescription: project.shortDescription,
        architecture: project.architecture || "Not specified",
        currentPhase: project.currentPhase,
        totalPhases: project.totalPhases,
        leaderName: project.team.leader.name || project.team.leader.email,
      },
      members,
      tasksSummary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        unassignedTasks,
        visibleTasks: tasks.map((task) => ({
          title: task.title,
          status: task.status,
          assignedTo: task.assignedTo?.name || task.assignedTo?.email || "Unassigned",
        })),
      },
      contributionBreakdown,
      logsSummary: {
        totalLogs: project.progressLogs.length,
        visibleLogs: logs.slice(0, 8).map((log) => ({
          author: log.user.name || log.user.email,
          createdAt: log.createdAt.toISOString(),
          content: log.content,
        })),
      },
      completionPercentage,
      insights: buildInsights({
        completionPercentage,
        unassignedTasks,
        logsCount: project.progressLogs.length,
        topContributor: contributionBreakdown[0]?.memberName || "No contributor yet",
      }),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("REPORT API ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
