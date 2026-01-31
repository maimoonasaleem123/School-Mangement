"use client";
import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import { useEffect, useState, useCallback } from "react";

const AttendanceChartContainer = () => {
  const [data, setData] = useState<{ name: string; present: number; absent: number }[]>([
    { name: "Mon", present: 0, absent: 0 },
    { name: "Tue", present: 0, absent: 0 },
    { name: "Wed", present: 0, absent: 0 },
    { name: "Thu", present: 0, absent: 0 },
    { name: "Fri", present: 0, absent: 0 },
  ]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/week");
      if (res.ok) {
        const json = await res.json();
        if (json?.data) setData(json.data);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [totals, setTotals] = useState<{ present: number; absent: number } | null>(null);

  const fetchTotals = useCallback(async (m?: number, y?: number) => {
    try {
      const res = await fetch(`/api/attendance/total?month=${m ?? month}&year=${y ?? year}`);
      if (!res.ok) return;
      const json = await res.json();
      setTotals(json.data || null);
    } catch (e) {
      // ignore
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
    fetchTotals();

    const es = new EventSource("/api/attendance/stream");
    es.onmessage = () => {
      fetchData();
    };
    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [fetchData, fetchTotals]);

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} className="p-1 border rounded">
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>{new Date(0, i).toLocaleString(undefined, { month: 'short' })}</option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value || '0', 10))} className="p-1 border rounded w-20" />
          <button className="px-3 py-1 bg-lamaYellow rounded" onClick={() => fetchTotals()}>
            Go
          </button>
          <Image src="/moreDark.png" alt="" width={20} height={20} />
        </div>
      </div>
      {totals ? (
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div className="text-sm">Total Present: <span className="font-semibold">{totals.present}</span></div>
          <div className="text-sm">Total Absent: <span className="font-semibold">{totals.absent}</span></div>
          <div className="text-sm">Attendance Rate: <span className="font-semibold">{totals.present + totals.absent === 0 ? '—' : `${Math.round((totals.present / (totals.present + totals.absent)) * 100)}%`}</span></div>
        </div>
      ) : null}
      <AttendanceChart data={data} />
    </div>
  );
};

export default AttendanceChartContainer;
