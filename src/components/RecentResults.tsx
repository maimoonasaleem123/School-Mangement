import prisma from "@/lib/prisma";
import React from "react";

const RecentResults = async ({ id }: { id: string }) => {
  const results = await prisma.result.findMany({
    where: { studentId: id },
    orderBy: { id: "desc" },
    include: {
      exam: { include: { lesson: { include: { subject: true } } } },
      assignment: { include: { lesson: { include: { subject: true } } } },
      subject: true,
      class: true,
    },
  });

  // Group results by submission (title + exam/assignment/class) so recent submissions show as a single card
  const groupsMap = new Map<string, any>();
  for (const r of results) {
    const assessment = r.exam || r.assignment;
    const title = r.title ?? assessment?.title ?? "Result";
    const key = `${title}::${r.examId ?? ""}::${r.assignmentId ?? ""}::${r.classId ?? ""}`;

    const subjectName = r.subject?.name ?? assessment?.lesson?.subject?.name ?? "";

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        title,
        subjectNames: new Set<string>(),
        totalScore: 0,
        totalMax: 0,
        // Result model doesn't have createdAt; use id as a proxy for recency
        date: r.id,
        studentId: r.studentId,
      });
    }

    const g = groupsMap.get(key);
    g.subjectNames.add(subjectName);
    g.totalScore += r.score ?? 0;
    g.totalMax += r.total ?? 0;
    if (!g.date || (r.id && r.id > g.date)) g.date = r.id;
  }

  const groups = Array.from(groupsMap.values())
    .sort((a: any, b: any) => (b.date as number) - (a.date as number))
    .slice(0, 6);

  return (
    <div>
      <h3 className="text-md font-semibold mb-3">Recent Results</h3>
      <ul className="space-y-3">
        {groups.map((g: any, idx: number) => {
          const percent = g.totalMax ? Math.round((g.totalScore / g.totalMax) * 100) : null;
          const grade = percent !== null ? (percent >= 80 ? "A+" : percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : percent >= 40 ? "D" : "F") : "-";
          const subjects = Array.from(g.subjectNames).filter(Boolean).slice(0, 3).join(", ");

          const href = `/list/results?studentId=${encodeURIComponent(g.studentId)}&search=${encodeURIComponent(g.title)}`;

          return (
            <li key={idx} className="rounded-md bg-white ring-1 ring-gray-100">
              <a href={href} className="block p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{g.title}</div>
                    <div className="text-xs text-gray-500">{subjects}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">{g.totalScore} / {g.totalMax}</div>
                    <div className="text-xs text-gray-500">{percent !== null ? `${percent}% • ${grade}` : "-"}</div>
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RecentResults;
