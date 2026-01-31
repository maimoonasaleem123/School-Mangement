import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { publishAttendanceEvent } from "@/lib/attendanceEvents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, lessonId, date } = body;

    if (!studentId || !lessonId) {
      return NextResponse.json({ error: "studentId and lessonId are required" }, { status: 400 });
    }

    let targetDate: Date;
    if (date) {
      const [y, m, d] = date.split("-").map((v: string) => parseInt(v, 10));
      targetDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    }

    const start = targetDate;
    const end = new Date(targetDate);
    end.setUTCDate(end.getUTCDate() + 1);

    const existing = await prisma.attendance.findFirst({ where: { studentId, lessonId, date: { gte: start, lt: end } } });
    if (existing) {
      await prisma.attendance.delete({ where: { id: existing.id } });
      try {
        publishAttendanceEvent({ studentId, lessonId: Number(lessonId), present: false, date: targetDate.toISOString().slice(0,10) });
      } catch (e) {}
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('attendance unmark error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
