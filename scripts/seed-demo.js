const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const prisma = new PrismaClient();
const shouldReset = process.argv.includes("--reset");
const shouldVerify = process.argv.includes("--verify");

const studentPassword = "Demo@1234";
const adminPassword = "Admin@1234";
const seedTag = "SkillVibe LinkedIn demo profile";

const skills = [
  "React",
  "Node.js",
  "Python",
  "Machine Learning",
  "UI/UX Design",
  "MongoDB",
  "Flutter",
  "Data Science",
  "DevOps",
  "Figma",
  "Java",
  "TypeScript",
  "FastAPI",
  "Firebase",
  "Full Stack",
  "ML/AI",
];

const students = [
  {
    key: "priya",
    name: "Priya Sharma",
    email: "priya.sharma@iitb.ac.in",
    college: "IIT Bombay",
    department: "Computer Science",
    year: 3,
    division: "A",
    skills: [
      ["Python", "Advanced"],
      ["Machine Learning", "Advanced"],
      ["React", "Intermediate"],
      ["Data Science", "Advanced"],
      ["FastAPI", "Intermediate"],
    ],
  },
  {
    key: "arjun",
    name: "Arjun Mehta",
    email: "arjun.mehta@bits-pilani.ac.in",
    college: "BITS Pilani",
    department: "Computer Science",
    year: 3,
    division: "B",
    skills: [
      ["React", "Advanced"],
      ["TypeScript", "Advanced"],
      ["Node.js", "Intermediate"],
      ["MongoDB", "Intermediate"],
    ],
  },
  {
    key: "ananya",
    name: "Ananya Iyer",
    email: "ananya.iyer@iitd.ac.in",
    college: "IIT Delhi",
    department: "Design and Computing",
    year: 2,
    division: "A",
    skills: [
      ["UI/UX Design", "Advanced"],
      ["Figma", "Advanced"],
      ["React", "Intermediate"],
      ["Flutter", "Beginner"],
    ],
  },
  {
    key: "rohan",
    name: "Rohan Kulkarni",
    email: "rohan.kulkarni@vit.ac.in",
    college: "VIT Vellore",
    department: "Information Technology",
    year: 3,
    division: "C",
    skills: [
      ["Node.js", "Advanced"],
      ["MongoDB", "Intermediate"],
      ["DevOps", "Intermediate"],
      ["Firebase", "Intermediate"],
    ],
  },
  {
    key: "isha",
    name: "Isha Nair",
    email: "isha.nair@nmims.edu",
    college: "NMIMS Mumbai",
    department: "Data Science",
    year: 2,
    division: "B",
    skills: [
      ["Python", "Intermediate"],
      ["Data Science", "Advanced"],
      ["Machine Learning", "Intermediate"],
      ["Figma", "Beginner"],
    ],
  },
  {
    key: "kabir",
    name: "Kabir Shah",
    email: "kabir.shah@djsce.edu.in",
    college: "DJ Sanghvi College",
    department: "Computer Engineering",
    year: 3,
    division: "A",
    skills: [
      ["React", "Intermediate"],
      ["Node.js", "Advanced"],
      ["TypeScript", "Intermediate"],
      ["DevOps", "Beginner"],
    ],
  },
  {
    key: "sanya",
    name: "Sanya Rao",
    email: "sanya.rao@tsec.edu",
    college: "Thadomal Shahani Engineering College",
    department: "Artificial Intelligence",
    year: 2,
    division: "D",
    skills: [
      ["Python", "Advanced"],
      ["Machine Learning", "Intermediate"],
      ["FastAPI", "Intermediate"],
      ["MongoDB", "Beginner"],
    ],
  },
  {
    key: "dev",
    name: "Dev Patel",
    email: "dev.patel@iitb.ac.in",
    college: "IIT Bombay",
    department: "Electronics and CS",
    year: 4,
    division: "A",
    skills: [
      ["Java", "Advanced"],
      ["React", "Intermediate"],
      ["Firebase", "Intermediate"],
      ["UI/UX Design", "Beginner"],
    ],
  },
  {
    key: "meera",
    name: "Meera Menon",
    email: "meera.menon@vit.ac.in",
    college: "VIT Vellore",
    department: "Information Technology",
    year: 2,
    division: "B",
    skills: [
      ["Flutter", "Advanced"],
      ["Firebase", "Advanced"],
      ["UI/UX Design", "Intermediate"],
      ["Figma", "Intermediate"],
    ],
  },
  {
    key: "vivek",
    name: "Vivek Reddy",
    email: "vivek.reddy@iitd.ac.in",
    college: "IIT Delhi",
    department: "Computer Science",
    year: 3,
    division: "C",
    skills: [
      ["Python", "Intermediate"],
      ["DevOps", "Advanced"],
      ["Node.js", "Intermediate"],
      ["MongoDB", "Intermediate"],
    ],
  },
];

const mentors = [
  {
    key: "neeraj",
    name: "Neeraj Kapoor",
    email: "mentor@skillvibe.com",
    department: "Full Stack Engineering",
    bio: "Senior full-stack architect mentoring students on scalable product engineering, clean APIs, and team execution.",
    menteeKeys: ["priya", "arjun", "ananya", "rohan", "isha"],
  },
  {
    key: "aisha",
    name: "Dr. Aisha Menon",
    email: "aisha.menon@skillvibe.com",
    department: "ML/AI",
    bio: "AI research mentor focused on applied machine learning, model evaluation, and responsible product thinking.",
    menteeKeys: ["kabir", "sanya", "dev", "meera", "vivek"],
  },
];

const admin = {
  name: "SkillVibe Admin",
  email: "admin@skillvibe.com",
};

const events = {
  hacksphere: {
    title: "HackSphere 2025",
    description:
      "Hackathon | Theme: AI & Sustainability. Build AI-powered solutions for real-world sustainability challenges.",
    minTeamSize: 3,
    maxTeamSize: 4,
    maxParticipants: 120,
    requiredSkills: ["Python", "Machine Learning", "React", "UI/UX Design"],
  },
  codestorm: {
    title: "CodeStorm 3.0",
    description:
      "Competitive Programming + Web Dev | Theme: Future of Web. Create high-performance web products after a fast-paced coding round.",
    minTeamSize: 2,
    maxTeamSize: 3,
    maxParticipants: 90,
    requiredSkills: ["React", "TypeScript", "Node.js", "MongoDB"],
  },
  innovate: {
    title: "InnovateMIT 2024",
    description:
      "Innovation Challenge | Theme: Smart Campus Solutions. Completed showcase for campus operations, student life, and sustainability ideas.",
    minTeamSize: 3,
    maxTeamSize: 4,
    maxParticipants: 100,
    requiredSkills: ["Java", "Firebase", "UI/UX Design", "Flutter"],
  },
};

function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function demoProfile(person) {
  return `${seedTag}. ${person.name} is a ${person.year || "senior"} year ${person.department} learner from ${person.college || person.department}, active in hackathons, product sprints, and collaborative engineering showcases.`;
}

async function resetSeedData() {
  const seedEmails = [
    ...students.map((student) => student.email),
    ...mentors.map((mentor) => mentor.email),
    admin.email,
  ];
  const seedEventTitles = Object.values(events).map((event) => event.title);

  const seedUsers = await prisma.user.findMany({
    where: { email: { in: seedEmails } },
    select: { id: true },
  });
  const seedUserIds = seedUsers.map((user) => user.id);

  const seedEvents = await prisma.event.findMany({
    where: { title: { in: seedEventTitles } },
    select: { id: true },
  });
  const seedEventIds = seedEvents.map((event) => event.id);

  const seedTeams = await prisma.team.findMany({
    where: {
      OR: [
        { eventId: { in: seedEventIds } },
        { name: { in: ["NeuralNinjas", "ByteBuilders", "CampusCoders"] } },
      ],
    },
    select: { id: true },
  });
  const seedTeamIds = seedTeams.map((team) => team.id);

  const seedProjects = await prisma.project.findMany({
    where: {
      OR: [
        { teamId: { in: seedTeamIds } },
        {
          title: {
            in: [
              "EcoPredict AI Workspace",
              "Sustainability Events Platform",
              "Smart Campus Command Center",
            ],
          },
        },
      ],
    },
    select: { id: true },
  });
  const seedProjectIds = seedProjects.map((project) => project.id);

  await prisma.progressLog.deleteMany({ where: { projectId: { in: seedProjectIds } } });
  await prisma.task.deleteMany({ where: { projectId: { in: seedProjectIds } } });
  await prisma.projectMember.deleteMany({ where: { projectId: { in: seedProjectIds } } });
  await prisma.projectInterest.deleteMany({ where: { projectId: { in: seedProjectIds } } });
  await prisma.project.deleteMany({ where: { id: { in: seedProjectIds } } });
  await prisma.teamJoinRequest.deleteMany({
    where: { OR: [{ teamId: { in: seedTeamIds } }, { userId: { in: seedUserIds } }] },
  });
  await prisma.teamMember.deleteMany({
    where: { OR: [{ teamId: { in: seedTeamIds } }, { userId: { in: seedUserIds } }] },
  });
  await prisma.team.deleteMany({ where: { id: { in: seedTeamIds } } });
  await prisma.certificate.deleteMany({
    where: { OR: [{ userId: { in: seedUserIds } }, { eventId: { in: seedEventIds } }] },
  });
  await prisma.participation.deleteMany({
    where: { OR: [{ userId: { in: seedUserIds } }, { eventId: { in: seedEventIds } }] },
  });
  await prisma.eventSkill.deleteMany({ where: { eventId: { in: seedEventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: seedEventIds } } });
  await prisma.mentorMentee.deleteMany({
    where: { OR: [{ mentorId: { in: seedUserIds } }, { studentId: { in: seedUserIds } }] },
  });
  await prisma.notification.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.userSkill.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.avatar.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.userItem.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.session.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.account.deleteMany({ where: { userId: { in: seedUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: seedUserIds } } });

  console.log("✅ Existing demo seed data cleared");
}

async function main() {
  if (shouldVerify) {
    const seedEmails = [
      ...students.map((student) => student.email),
      ...mentors.map((mentor) => mentor.email),
      admin.email,
    ];
    const seedEventTitles = Object.values(events).map((event) => event.title);

    const roleCounts = await prisma.user.groupBy({
      by: ["role"],
      where: { email: { in: seedEmails } },
      _count: { _all: true },
    });
    const eventRows = await prisma.event.findMany({
      where: { title: { in: seedEventTitles } },
      select: {
        title: true,
        participations: { select: { id: true } },
        certificates: { select: { id: true, type: true } },
        teams: {
          select: {
            name: true,
            isLocked: true,
            isReady: true,
            members: { select: { id: true } },
            project: {
              select: {
                title: true,
                tasks: { select: { id: true, status: true } },
                progressLogs: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { registrationStartDate: "asc" },
    });
    const mentorAssignments = await prisma.mentorMentee.count({
      where: {
        mentor: {
          email: { in: mentors.map((mentor) => mentor.email) },
        },
      },
    });
    const notifications = await prisma.notification.count({
      where: {
        user: { email: { in: seedEmails } },
      },
    });

    console.log(JSON.stringify({
      roleCounts,
      events: eventRows.map((event) => ({
        title: event.title,
        participations: event.participations.length,
        winnerCertificates: event.certificates.filter((certificate) => certificate.type === "WON").length,
        teams: event.teams.map((team) => ({
          name: team.name,
          locked: team.isLocked,
          ready: team.isReady,
          members: team.members.length,
          workspace: team.project?.title ?? null,
          tasks: team.project?.tasks.length ?? 0,
          doneTasks: team.project?.tasks.filter((task) => task.status === "DONE").length ?? 0,
          logs: team.project?.progressLogs.length ?? 0,
        })),
      })),
      mentorAssignments,
      notifications,
    }, null, 2));
    return;
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: admin.email },
    select: { id: true },
  });

  if (existingAdmin && !shouldReset) {
    console.log("Demo seed data already exists. Run `node scripts/seed-demo.js --reset` to recreate it.");
    return;
  }

  if (shouldReset) {
    await resetSeedData();
  }

  const passwordHash = await bcrypt.hash(studentPassword, 10);
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const skillByName = {};
  for (const skillName of skills) {
    skillByName[skillName] = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });
  }
  console.log("✅ Skills created");

  const users = {};
  for (const student of students) {
    const user = await prisma.user.create({
      data: {
        name: student.name,
        email: student.email,
        password: passwordHash,
        role: "STUDENT",
        studentId: `SV-${student.college.replace(/[^A-Z]/gi, "").slice(0, 4).toUpperCase()}-${student.key.toUpperCase()}`,
        department: student.department,
        batch: student.college,
        year: student.year,
        division: student.division,
        bio: demoProfile(student),
        linkedinUrl: `https://linkedin.com/in/${student.name.toLowerCase().replace(/\s+/g, "-")}`,
        githubUrl: `https://github.com/${student.key}-skillvibe`,
        portfolioUrl: `https://${student.key}.dev`,
        coins: 120,
        skills: {
          create: student.skills.map(([skillName, level]) => ({
            skillId: skillByName[skillName].id,
            level,
            endorsed: level !== "Beginner",
          })),
        },
        avatar: { create: {} },
      },
    });
    users[student.key] = user;
  }

  for (const mentor of mentors) {
    const user = await prisma.user.create({
      data: {
        name: mentor.name,
        email: mentor.email,
        password: passwordHash,
        role: "MENTOR",
        mentorId: `MENTOR-${mentor.key.toUpperCase()}`,
        department: mentor.department,
        bio: mentor.bio,
        linkedinUrl: `https://linkedin.com/in/${mentor.name.toLowerCase().replace(/\s+/g, "-")}`,
        githubUrl: `https://github.com/${mentor.key}-mentor`,
        skills: {
          create: [
            { skillId: skillByName[mentor.department === "ML/AI" ? "ML/AI" : "Full Stack"].id, level: "Advanced", endorsed: true },
            { skillId: skillByName[mentor.department === "ML/AI" ? "Machine Learning" : "Node.js"].id, level: "Advanced", endorsed: true },
          ],
        },
        avatar: { create: {} },
      },
    });
    users[mentor.key] = user;
  }

  users.admin = await prisma.user.create({
    data: {
      name: admin.name,
      email: admin.email,
      password: adminPasswordHash,
      role: "ADMIN",
      adminId: "SKILLVIBE-ADMIN",
      department: "Platform Operations",
      bio: "SkillVibe platform administrator managing events, users, teams, and workspace analytics.",
      coins: 500,
      avatar: { create: {} },
    },
  });

  for (const mentor of mentors) {
    for (const studentKey of mentor.menteeKeys) {
      await prisma.mentorMentee.create({
        data: {
          mentorId: users[mentor.key].id,
          studentId: users[studentKey].id,
        },
      });
    }
  }
  console.log("✅ Users created");
  console.log("✅ Mentor assignments created");

  const createdEvents = {};
  const eventRows = [
    ["hacksphere", -2, 5, true, "/events/hacksphere-2025/register"],
    ["codestorm", 3, 10, false, "/events/codestorm-3/register"],
    ["innovate", -390, -380, false, "/events/innovatemit-2024/archive"],
  ];

  for (const [key, startOffset, endOffset, isOpen, link] of eventRows) {
    const event = events[key];
    createdEvents[key] = await prisma.event.create({
      data: {
        title: event.title,
        description: event.description,
        minTeamSize: event.minTeamSize,
        maxTeamSize: event.maxTeamSize,
        maxParticipants: event.maxParticipants,
        registrationStartDate: daysFromNow(startOffset),
        registrationEndDate: daysFromNow(endOffset),
        externalLink: link,
        posterUrl: null,
        isRegistrationOpen: isOpen,
        eventSkills: {
          create: event.requiredSkills.map((skillName) => ({
            skillId: skillByName[skillName].id,
          })),
        },
      },
    });
  }
  console.log("✅ Events created");

  const participationPairs = [
    ["hacksphere", ["priya", "arjun", "ananya", "rohan", "isha", "kabir", "sanya", "vivek"]],
    ["codestorm", ["arjun", "kabir", "vivek", "meera"]],
    ["innovate", ["dev", "meera", "ananya", "isha"]],
  ];
  for (const [eventKey, userKeys] of participationPairs) {
    for (const userKey of userKeys) {
      await prisma.participation.create({
        data: {
          userId: users[userKey].id,
          eventId: createdEvents[eventKey].id,
          status: "CONFIRMED",
          createdAt: daysFromNow(eventKey === "innovate" ? -389 : -3),
        },
      });
    }
  }
  console.log("✅ Participations created");

  async function createTeam({ name, code, eventKey, leaderKey, memberKeys, isLocked, isReady }) {
    return prisma.team.create({
      data: {
        name,
        code,
        eventId: createdEvents[eventKey].id,
        leaderId: users[leaderKey].id,
        isLocked,
        isReady,
        members: {
          create: memberKeys.map((memberKey) => ({
            userId: users[memberKey].id,
          })),
        },
      },
      include: { members: true },
    });
  }

  const neuralNinjas = await createTeam({
    name: "NeuralNinjas",
    code: "NN2025",
    eventKey: "hacksphere",
    leaderKey: "priya",
    memberKeys: ["priya", "arjun", "ananya"],
    isLocked: true,
    isReady: true,
  });
  const byteBuilders = await createTeam({
    name: "ByteBuilders",
    code: "BB2025",
    eventKey: "hacksphere",
    leaderKey: "kabir",
    memberKeys: ["kabir", "sanya", "rohan"],
    isLocked: true,
    isReady: true,
  });
  const campusCoders = await createTeam({
    name: "CampusCoders",
    code: "CC2024",
    eventKey: "innovate",
    leaderKey: "dev",
    memberKeys: ["dev", "meera", "ananya", "isha"],
    isLocked: true,
    isReady: true,
  });
  console.log("✅ Teams created");

  async function createWorkspace({ title, shortDescription, fullDescription, team, ownerKey, totalPhases, currentPhase }) {
    const project = await prisma.project.create({
      data: {
        title,
        shortDescription,
        fullDescription,
        architecture: "Modular product architecture with typed APIs, reusable UI components, and analytics-ready workspace data.",
        totalPhases,
        currentPhase,
        ownerId: users[ownerKey].id,
        teamId: team.id,
      },
    });

    for (const member of team.members) {
      await prisma.projectMember.create({
        data: { projectId: project.id, userId: member.userId },
      });
    }

    return project;
  }

  const neuralProject = await createWorkspace({
    title: "EcoPredict AI Workspace",
    shortDescription: "AI dashboard for carbon footprint prediction and sustainability recommendations.",
    fullDescription: "NeuralNinjas are building a polished AI product that predicts carbon footprint from user activity and recommends sustainable alternatives.",
    team: neuralNinjas,
    ownerKey: "priya",
    totalPhases: 5,
    currentPhase: 3,
  });
  const byteProject = await createWorkspace({
    title: "Sustainability Events Platform",
    shortDescription: "Full-stack event experience for sustainability communities.",
    fullDescription: "ByteBuilders are creating a fast web platform for listing, joining, and managing sustainability events.",
    team: byteBuilders,
    ownerKey: "kabir",
    totalPhases: 4,
    currentPhase: 2,
  });
  const campusProject = await createWorkspace({
    title: "Smart Campus Command Center",
    shortDescription: "Completed smart campus solution for student services and facility insights.",
    fullDescription: "CampusCoders delivered a complete campus operations dashboard with mobile-first reporting and admin analytics.",
    team: campusCoders,
    ownerKey: "dev",
    totalPhases: 4,
    currentPhase: 4,
  });

  async function createTask(projectId, title, status, assignedToKey, daysAgo, description) {
    return prisma.task.create({
      data: {
        projectId,
        title,
        description,
        status,
        assignedToId: assignedToKey ? users[assignedToKey].id : null,
        createdAt: daysFromNow(daysAgo),
        completedAt: status === "DONE" ? daysFromNow(Math.min(daysAgo + 1, -1)) : null,
      },
    });
  }

  await createTask(neuralProject.id, "Design system architecture", "DONE", "priya", -5, "Define ML, API, and frontend architecture.");
  await createTask(neuralProject.id, "Build ML model for carbon footprint prediction", "DONE", "sanya", -5, "Train and evaluate sustainability prediction model.");
  await createTask(neuralProject.id, "Develop React frontend dashboard", "IN_PROGRESS", "arjun", -4, "Build dashboard shell, charts, and summary views.");
  await createTask(neuralProject.id, "Integrate backend APIs", "IN_PROGRESS", "rohan", -4, "Connect frontend flows with API responses.");
  await createTask(neuralProject.id, "Write project documentation", "TODO", "priya", -2, "Prepare README, architecture notes, and demo script.");
  await createTask(neuralProject.id, "Deploy on AWS/Vercel", "TODO", null, -1, "Deploy production-ready demo build.");

  await createTask(byteProject.id, "UI mockups in Figma", "DONE", "ananya", -3, "Create event listing and team flow mockups.");
  await createTask(byteProject.id, "Setup Node.js backend", "DONE", "kabir", -3, "Create backend structure and database connectors.");
  await createTask(byteProject.id, "Build authentication module", "DONE", "rohan", -2, "Implement login, session, and protected routes.");
  await createTask(byteProject.id, "Create event listing page", "IN_PROGRESS", "kabir", -2, "Build responsive event browsing experience.");
  await createTask(byteProject.id, "Mobile responsiveness", "TODO", "sanya", -1, "Polish mobile layouts and interaction states.");

  const completedCampusTasks = [
    ["Discovery interviews with students", "dev"],
    ["Firebase data model", "meera"],
    ["Admin dashboard prototype", "ananya"],
    ["Campus issue reporting flow", "isha"],
    ["Analytics and leaderboard", "dev"],
    ["Final pitch deck and demo video", "meera"],
  ];
  for (const [title, ownerKey] of completedCampusTasks) {
    await createTask(campusProject.id, title, "DONE", ownerKey, -386, "Completed during InnovateMIT 2024 final sprint.");
  }
  console.log("✅ Workspace tasks created");

  async function log(projectId, userKey, content, daysAgo) {
    return prisma.progressLog.create({
      data: {
        projectId,
        userId: users[userKey].id,
        content,
        createdAt: daysFromNow(daysAgo),
      },
    });
  }

  await log(neuralProject.id, "ananya", "Completed the initial wireframes in Figma, shared with team for review", -5);
  await log(neuralProject.id, "sanya", "Trained the ML model with 87% accuracy on test dataset", -4);
  await log(neuralProject.id, "priya", "Set up project repo and configured CI/CD pipeline", -3);
  await log(neuralProject.id, "arjun", "Finished the dashboard UI components, awaiting API integration", -2);
  await log(neuralProject.id, "priya", "Reviewed architecture diagram with mentor, got approval", -1);

  await log(byteProject.id, "ananya", "Shared polished Figma mockups for the event listing and onboarding screens", -3);
  await log(byteProject.id, "kabir", "Completed backend setup and connected MongoDB models", -2);
  await log(byteProject.id, "rohan", "Authentication module is passing local smoke tests", -2);
  await log(byteProject.id, "sanya", "Started mobile responsiveness pass for dashboard cards", -1);

  await log(campusProject.id, "dev", "Final deployment completed and evaluated by judges", -381);
  await log(campusProject.id, "meera", "Uploaded final mobile demo and user journey walkthrough", -381);
  await log(campusProject.id, "ananya", "Prepared presentation visuals for winning pitch", -380);
  console.log("✅ Work logs created");

  for (const memberKey of ["dev", "meera", "ananya", "isha"]) {
    await prisma.certificate.create({
      data: {
        userId: users[memberKey].id,
        eventId: createdEvents.innovate.id,
        title: "Winner - InnovateMIT 2024",
        eventName: "InnovateMIT 2024",
        type: "WON",
        fileUrl: "/uploads/certificates/innovatemit-2024-winner.pdf",
        fileName: "innovatemit-2024-winner.pdf",
        mimeType: "application/pdf",
        fileSize: 248000,
        isSkillVibeEvent: true,
        coinsAwarded: 250,
        createdAt: daysFromNow(-380),
      },
    });
  }
  console.log("✅ Winner certificates created");

  const joinRequestOne = await prisma.teamJoinRequest.create({
    data: {
      teamId: neuralNinjas.id,
      userId: users.isha.id,
      status: "PENDING",
      createdAt: daysFromNow(-1),
    },
  });
  const joinRequestTwo = await prisma.teamJoinRequest.create({
    data: {
      teamId: neuralNinjas.id,
      userId: users.vivek.id,
      status: "PENDING",
      createdAt: daysFromNow(-1),
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: users.priya.id,
        message: "Isha Nair requested to join your team NeuralNinjas.",
        type: "TEAM_REQUEST",
        requestId: joinRequestOne.id,
        createdAt: daysFromNow(-1),
      },
      {
        userId: users.priya.id,
        message: "Vivek Reddy requested to join your team NeuralNinjas.",
        type: "TEAM_REQUEST",
        requestId: joinRequestTwo.id,
        createdAt: daysFromNow(-1),
      },
      {
        userId: users.sanya.id,
        message: "Your request to join ByteBuilders was approved.",
        type: "TEAM_APPROVAL",
        createdAt: daysFromNow(-2),
        read: true,
      },
      {
        userId: users.arjun.id,
        message: "CodeStorm 3.0 registration opens in 3 days. Prepare your Future of Web team.",
        type: "EVENT_REMINDER",
        createdAt: daysFromNow(0),
      },
      {
        userId: users.priya.id,
        message: "Mentor Neeraj Kapoor reviewed your architecture and left positive feedback.",
        type: "MENTOR_FEEDBACK",
        createdAt: daysFromNow(-1),
      },
    ],
  });
  console.log("✅ Notifications created");

  console.log(`
---
🌱 SKILLVIBE SEED COMPLETE
--------------------------------
👤 Users:       10 students, 2 mentors, 1 admin
🎪 Events:      3 (1 ongoing, 1 upcoming, 1 past)
👥 Teams:       3 teams across 2 events
🚀 Workspaces: 3 workspaces with tasks & logs
📬 Notifications: 5 created
--------------------------------
🔑 Login Credentials:
   Admin:   admin@skillvibe.com / Admin@1234
   Student: priya.sharma@iitb.ac.in / Demo@1234
   Mentor:  mentor@skillvibe.com / Demo@1234
---`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
