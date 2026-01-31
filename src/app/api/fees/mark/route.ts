import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, date, paid } = body;
    if (!studentId || !date || typeof paid === 'undefined') {
      return NextResponse.json({ error: 'studentId, date, paid required' }, { status: 400 });
    }

    // parse date (yyyy-mm-dd) to UTC midnight
    const [y, m, d] = String(date).split('-').map((v: string) => parseInt(v, 10));
    const target = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));

    const start = target;
    const end = new Date(target);
    end.setUTCDate(end.getUTCDate() + 1);

    const existing = await prisma.fee.findFirst({ where: { studentId, date: { gte: start, lt: end } } });
    if (existing) {
      await prisma.fee.update({ where: { id: existing.id }, data: { paid } });
    } else {
      await prisma.fee.create({ data: { studentId, date: target, paid } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log('fees mark error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
