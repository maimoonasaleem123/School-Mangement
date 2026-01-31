export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const monthStr = url.searchParams.get('month');
    const yearStr = url.searchParams.get('year');

    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

    const now = new Date();
    const m = monthStr ? parseInt(monthStr, 10) - 1 : now.getMonth();
    const y = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    // compute UTC boundaries for month
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));

    const data = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: start,
          lt: end,
        },
      },
      include: { lesson: { select: { id: true, name: true, class: { select: { name: true } } } } },
      orderBy: { date: 'asc' },
    });

    const out = data.map((d) => ({ date: d.date.toISOString().slice(0, 10), present: d.present, lessonName: d.lesson?.name || null }));

    return NextResponse.json({ data: out });
  } catch (err) {
    console.log('attendance API error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
