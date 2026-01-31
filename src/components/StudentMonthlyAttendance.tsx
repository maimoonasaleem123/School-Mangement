"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { date: string; present: boolean; lessonName?: string | null };

export default function StudentMonthlyAttendance({ id, month, year }: { id: string; month?: number; year?: number }) {
  const now = new Date();
  const [m, setM] = useState<number>(month ?? now.getMonth() + 1);
  const [y, setY] = useState<number>(year ?? now.getFullYear());
  const [data, setData] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (mm: number, yy: number) => {
    setLoading(true);
    const res = await fetch(`/api/attendance/student?studentId=${encodeURIComponent(id)}&month=${mm}&year=${yy}`);
    const json = await res.json();
    setData(json.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData(m, y);
  }, [m, y, id]);

  // poll for updates so students see marks shortly after teachers submit
  useEffect(() => {
    const interval = setInterval(() => fetchData(m, y), 10000); // every 10s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, y, id]);

  // real-time updates via SSE: refresh when an attendance event for this student arrives
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/attendance/stream`);
      es.onmessage = (e) => {
        try {
          const ev = JSON.parse(e.data) as { studentId: string };
          if (ev.studentId === id) {
            fetchData(m, y);
          }
        } catch (err) {
          // ignore parse errors
        }
      };
    } catch (err) {
      // EventSource not supported or connection failed
    }

    return () => {
      if (es) es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, m, y]);

  const daysInMonth = useMemo(() => new Date(y, m, 0).getDate(), [m, y]);

  const rows = [] as JSX.Element[];
  const map = new Map(data?.map((d) => [d.date, d]));

  let presentCount = 0;
  let recorded = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    // construct UTC midnight for the day so keys match stored UTC dates
    const dtUtc = new Date(Date.UTC(y, m - 1, day));
    const key = dtUtc.toISOString().slice(0, 10);
    const rec = map.get(key) as Row | undefined;
    let status = "-";
    if (rec) {
      recorded++;
      status = rec.present ? "Present" : "Absent";
      if (rec.present) presentCount++;
    }
    const isToday = key === new Date().toISOString().slice(0, 10);
    rows.push(
      <tr key={key} className={`border-b ${isToday ? "bg-yellow-50" : ""}`}>
        <td className="p-2">{dtUtc.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td className="p-2">
          {rec ? (
            <span className={rec.present ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
              {rec.present ? "Present" : "Absent"}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
    
      </tr>
    );
  }

  const percent = recorded ? Math.round((presentCount / recorded) * 100) : null;

  const exportCSV = () => {
    if (!data) return;
    const header = ["date", "status", "lesson"].join(",") + "\n";
    const body = [] as string[];
    for (let day = 1; day <= daysInMonth; day++) {
      const dtUtc = new Date(Date.UTC(y, m - 1, day));
      const key = dtUtc.toISOString().slice(0, 10);
      const rec = map.get(key) as Row | undefined;
      const status = rec ? (rec.present ? "Present" : "Absent") : "-";
      body.push([key, status, rec?.lessonName ?? ""].join(","));
    }
    const csv = header + body.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${id}_${y}_${m}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Monthly Attendance</h3>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">{percent ?? "-"}%</div>
          <button onClick={exportCSV} className="px-2 py-1 bg-lamaYellow rounded text-sm">
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <select value={m} onChange={(e) => setM(parseInt(e.target.value, 10))} className="p-2 border rounded">
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString(undefined, { month: "long" })}
            </option>
          ))}
        </select>
        <input type="number" value={y} onChange={(e) => setY(parseInt(e.target.value || "0", 10))} className="p-2 border rounded w-24" />
        <button onClick={() => fetchData(m, y)} className="px-3 py-1 bg-lamaYellow rounded">
          Go
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
             
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      )}
    </div>
  );
}
