"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type ReportData = {
  title: string;
  generatedAt: string;
  teamInfo: {
    teamName: string;
    teamCode: string;
    eventTitle: string;
    projectTitle: string;
    shortDescription: string;
    architecture: string;
    currentPhase: number;
    totalPhases: number;
    leaderName: string;
  };
  members: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
  }>;
  tasksSummary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    unassignedTasks: number;
    visibleTasks: Array<{
      title: string;
      status: string;
      assignedTo: string;
    }>;
  };
  contributionBreakdown: Array<{
    memberName: string;
    memberEmail: string;
    role: string;
    tasksAssigned: number;
    tasksCompleted: number;
    logsCreated: number;
    score: number;
  }>;
  logsSummary: {
    totalLogs: number;
    visibleLogs: Array<{
      author: string;
      createdAt: string;
      content: string;
    }>;
  };
  completionPercentage: number;
  insights: string[];
};

export default function WorkspaceReportDownload({ teamId }: { teamId: string }) {
  const [format, setFormat] = useState<"pdf" | "doc">("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/project/report?teamId=${teamId}`);
      const data = (await res.json()) as ReportData | { error?: string };

      if (!res.ok) {
        throw new Error(("error" in data && data.error) || "Failed to generate report");
      }

      if (format === "pdf") {
        await exportPdf(data as ReportData);
      } else {
        await exportDoc(data as ReportData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-white/60">
          Workspace Report
        </p>
        <p className="mt-1 text-sm text-white/80">
          Export a polished report for dashboard review and mentor oversight.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as "pdf" | "doc")}
          className="rounded-2xl border border-white/15 bg-white/14 px-4 py-3 text-sm font-medium text-white outline-none backdrop-blur"
        >
          <option value="pdf" className="text-slate-900">
            PDF
          </option>
          <option value="doc" className="text-slate-900">
            DOC
          </option>
        </select>

        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:shadow-lg disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {loading ? "Generating..." : "Download Report"}
        </button>
      </div>

      {error ? <p className="text-sm text-rose-100">{error}</p> : null}
    </div>
  );
}

async function exportPdf(report: ReportData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 20;

  const addLine = (text: string, size = 10, bold = false) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 5;
  };

  const sectionTitle = (title: string) => {
    y += 2;
    addLine(title, 14, true);
    doc.setDrawColor(180, 190, 210);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 1;
  };

  addLine(report.title, 18, true);
  addLine(`Generated on ${new Date(report.generatedAt).toLocaleString("en-IN")}`, 10);

  sectionTitle("Team Info");
  addLine(`Team: ${report.teamInfo.teamName}`);
  addLine(`Code: ${report.teamInfo.teamCode}`);
  addLine(`Event: ${report.teamInfo.eventTitle}`);
  addLine(`Leader: ${report.teamInfo.leaderName}`);
  addLine(`Project: ${report.teamInfo.projectTitle}`);
  addLine(`Architecture: ${report.teamInfo.architecture}`);
  addLine(`Phase: ${report.teamInfo.currentPhase}/${report.teamInfo.totalPhases}`);

  sectionTitle("Members");
  report.members.forEach((member, index) => {
    addLine(`${index + 1}. ${member.name || member.email} | ${member.role} | ${member.email}`);
  });

  sectionTitle("Tasks Summary");
  addLine(`Total Tasks: ${report.tasksSummary.totalTasks}`);
  addLine(`Completed: ${report.tasksSummary.completedTasks}`);
  addLine(`In Progress: ${report.tasksSummary.inProgressTasks}`);
  addLine(`To Do: ${report.tasksSummary.todoTasks}`);
  addLine(`Unassigned: ${report.tasksSummary.unassignedTasks}`);
  report.tasksSummary.visibleTasks.slice(0, 10).forEach((task) => {
    addLine(`- ${task.title} | ${task.status} | ${task.assignedTo}`);
  });

  sectionTitle("Contribution Breakdown");
  report.contributionBreakdown.forEach((entry) => {
    addLine(
      `${entry.memberName} | Assigned ${entry.tasksAssigned} | Completed ${entry.tasksCompleted} | Logs ${entry.logsCreated} | Score ${entry.score}`,
    );
  });

  sectionTitle("Logs Summary");
  addLine(`Total Logs: ${report.logsSummary.totalLogs}`);
  report.logsSummary.visibleLogs.forEach((log) => {
    addLine(
      `${log.author} | ${new Date(log.createdAt).toLocaleDateString("en-IN")} | ${log.content}`,
    );
  });

  sectionTitle("Completion");
  addLine(`Completion Percentage: ${report.completionPercentage}%`, 12, true);

  sectionTitle("Insights");
  report.insights.forEach((insight, index) => {
    addLine(`${index + 1}. ${insight}`);
  });

  doc.save(`${slugify(report.teamInfo.teamName)}-workspace-report.pdf`);
}

async function exportDoc(report: ReportData) {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = await import("docx");

  const heading = (text: string) =>
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, bold: true, size: 28 })],
    });

  const simpleParagraph = (text: string) =>
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text, size: 22 })],
    });

  const memberTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["Name", "Role", "Email"].map((label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
        ),
      }),
      ...report.members.map(
        (member) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(member.name || member.email)] }),
              new TableCell({ children: [new Paragraph(member.role)] }),
              new TableCell({ children: [new Paragraph(member.email)] }),
            ],
          }),
      ),
    ],
  });

  const contributionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["Member", "Assigned", "Completed", "Logs", "Score"].map((label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
        ),
      }),
      ...report.contributionBreakdown.map(
        (entry) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(entry.memberName)] }),
              new TableCell({ children: [new Paragraph(String(entry.tasksAssigned))] }),
              new TableCell({ children: [new Paragraph(String(entry.tasksCompleted))] }),
              new TableCell({ children: [new Paragraph(String(entry.logsCreated))] }),
              new TableCell({ children: [new Paragraph(String(entry.score))] }),
            ],
          }),
      ),
    ],
  });

  const taskTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ["Task", "Status", "Assigned To"].map((label) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
          }),
        ),
      }),
      ...report.tasksSummary.visibleTasks.map(
        (task) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(task.title)] }),
              new TableCell({ children: [new Paragraph(task.status)] }),
              new TableCell({ children: [new Paragraph(task.assignedTo)] }),
            ],
          }),
      ),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: report.title, bold: true, size: 34 })],
          }),
          simpleParagraph(`Generated on ${new Date(report.generatedAt).toLocaleString("en-IN")}`),
          heading("Team Info"),
          simpleParagraph(`Team: ${report.teamInfo.teamName}`),
          simpleParagraph(`Code: ${report.teamInfo.teamCode}`),
          simpleParagraph(`Event: ${report.teamInfo.eventTitle}`),
          simpleParagraph(`Leader: ${report.teamInfo.leaderName}`),
          simpleParagraph(`Project: ${report.teamInfo.projectTitle}`),
          simpleParagraph(`Completion: ${report.completionPercentage}%`),
          heading("Members"),
          memberTable,
          heading("Tasks Summary"),
          simpleParagraph(`Total Tasks: ${report.tasksSummary.totalTasks}`),
          simpleParagraph(`Completed Tasks: ${report.tasksSummary.completedTasks}`),
          simpleParagraph(`In Progress Tasks: ${report.tasksSummary.inProgressTasks}`),
          simpleParagraph(`To Do Tasks: ${report.tasksSummary.todoTasks}`),
          simpleParagraph(`Unassigned Tasks: ${report.tasksSummary.unassignedTasks}`),
          taskTable,
          heading("Contribution Breakdown"),
          contributionTable,
          heading("Logs Summary"),
          simpleParagraph(`Total Logs: ${report.logsSummary.totalLogs}`),
          ...report.logsSummary.visibleLogs.map((log) =>
            simpleParagraph(
              `${log.author} | ${new Date(log.createdAt).toLocaleDateString("en-IN")} | ${log.content}`,
            ),
          ),
          heading("Insights"),
          ...report.insights.map((insight) => simpleParagraph(`• ${insight}`)),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${slugify(report.teamInfo.teamName)}-workspace-report.docx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}
