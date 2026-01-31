import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { publishAttendanceEvent } from '@/lib/attendanceEvents';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, lessonId, present, date } = body;

    if (!studentId || !lessonId || typeof present === 'undefined') {
      return NextResponse.json({ error: 'studentId, lessonId and present are required' }, { status: 400 });
    }

    // parse date if provided (yyyy-mm-dd) to UTC midnight
    let targetDate: Date;
    if (date) {
      const [y, m, d] = date.split('-').map((v: string) => parseInt(v, 10));
      targetDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    }

    const start = targetDate;
    const end = new Date(targetDate);
    end.setUTCDate(end.getUTCDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: { studentId, lessonId, date: { gte: start, lt: end } },
    });

    if (existing) {
      await prisma.attendance.update({ where: { id: existing.id }, data: { present, date: targetDate } });
    } else {
      await prisma.attendance.create({ data: { studentId, lessonId, present, date: targetDate } });
    }

    // publish event for real-time update listeners
    try {
      publishAttendanceEvent({ studentId, lessonId: Number(lessonId), present, date: targetDate.toISOString().slice(0, 10) });
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log('attendance mark error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
