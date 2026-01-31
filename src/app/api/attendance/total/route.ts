import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const monthStr = url.searchParams.get("month");
    const yearStr = url.searchParams.get("year");

    const now = new Date();
    const m = monthStr ? parseInt(monthStr, 10) - 1 : now.getMonth();
    const y = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));

    const presentCount = await prisma.attendance.count({ where: { date: { gte: start, lt: end }, present: true } });
    const absentCount = await prisma.attendance.count({ where: { date: { gte: start, lt: end }, present: false } });

    return NextResponse.json({ data: { present: presentCount, absent: absentCount } });
  } catch (err) {
    console.error("attendance total error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
