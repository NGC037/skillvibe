export type MentorSkill = {
  id: string;
  name: string;
  level?: string;
  endorsed?: boolean;
};

export type MentorMenteeSummary = {
  id: string;
  name: string | null;
  email: string;
  department: string | null;
  year: number | null;
  division: string | null;
  skills: MentorSkill[];
};

export type MentorWorkspaceTeam = {
  id: string;
  name: string | null;
  code: string;
  leaderId: string;
  leader: {
    id: string;
    name: string | null;
    email: string;
  };
  members: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  project: {
    id: string;
    title: string;
    tasks: Array<{
      id: string;
      status: string;
      assignedToId: string | null;
    }>;
    progressLogs: Array<{
      id: string;
      userId: string;
      createdAt: string;
    }>;
  } | null;
};

export type MenteeProof = {
  id: string;
  title: string;
  url: string;
  kind: "LINK" | "CERTIFICATE" | "UPLOAD";
  source: string;
  eventTitle?: string | null;
};

export type MenteeEventRecord = {
  id: string;
  title: string;
  status: string;
  participatedAt: string;
  externalLink: string | null;
  teamId: string | null;
  teamName: string | null;
  workspaceCompletion: number;
  proofCount: number;
  isWinner: boolean;
  winLabel: string | null;
  winConfidence: "verified" | "inferred" | "none";
};

export type MenteeLogRecord = {
  id: string;
  content: string;
  createdAt: string;
  teamId: string;
  teamName: string;
  projectId: string;
  projectTitle: string;
};

export type MenteeContributionRecord = {
  projectId: string;
  projectTitle: string;
  teamId: string;
  teamName: string;
  tasksCompleted: number;
  logsCreated: number;
  score: number;
};

export type MentorMenteeDetails = {
  mentee: {
    id: string;
    name: string | null;
    email: string;
    department: string | null;
    year: number | null;
    division: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    skills: MentorSkill[];
  };
  overview: {
    totalEvents: number;
    winsCount: number;
    proofCount: number;
    contributionScore: number;
    tasksCompleted: number;
    logsCreated: number;
    activityLevel: "High" | "Moderate" | "Emerging";
  };
  events: MenteeEventRecord[];
  wins: MenteeEventRecord[];
  proofs: MenteeProof[];
  contributions: MenteeContributionRecord[];
  logs: MenteeLogRecord[];
  workspaces: MentorWorkspaceTeam[];
};
