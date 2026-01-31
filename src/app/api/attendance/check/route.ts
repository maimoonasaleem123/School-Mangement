export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const lessonId = url.searchParams.get('lessonId');
    const date = url.searchParams.get('date');

    if (!studentId || !lessonId) return NextResponse.json({ error: 'studentId and lessonId required' }, { status: 400 });

    let targetDate: Date;
    if (date) {
      const [y, m, d] = date.split('-').map((v) => parseInt(v, 10));
      targetDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    }

    const start = targetDate;
    const end = new Date(targetDate);
    end.setUTCDate(end.getUTCDate() + 1);

    const rec = await prisma.attendance.findFirst({ where: { studentId, lessonId: parseInt(lessonId), date: { gte: start, lt: end } } });

    if (!rec) return NextResponse.json({ data: null });

    return NextResponse.json({ data: { present: rec.present, date: rec.date.toISOString().slice(0,10) } });
  } catch (err) {
    console.log('attendance check error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
