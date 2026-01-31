import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentId = url.searchParams.get('studentId');
    const start = url.searchParams.get('start'); // inclusive yyyy-mm-dd
    const end = url.searchParams.get('end'); // exclusive yyyy-mm-dd

    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    if (!start || !end) return NextResponse.json({ error: 'start and end required' }, { status: 400 });

    const startDate = new Date(start);
    const endDate = new Date(end);

    const data = await prisma.fee.findMany({
      where: {
        studentId,
        date: { gte: startDate, lt: endDate },
      },
      orderBy: { date: 'asc' },
    });

    const out = data.map(d => ({ date: d.date.toISOString().slice(0,10), paid: d.paid }));
    return NextResponse.json({ data: out });
  } catch (err) {
    console.log('fees student api error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
