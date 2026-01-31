"use client";

import { useEffect, useMemo, useState } from "react";

type MonthRow = { key: string; label: string; date: string; paid: boolean };

export default function StudentFees({ id, role }: { id: string; role?: string }) {
  const now = new Date();
  const [baseMonth, setBaseMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [baseYear, setBaseYear] = useState<number>(now.getFullYear());
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(false);

  const months = useMemo(() => {
    const dt = new Date(Date.UTC(baseYear, baseMonth - 1, 1));
    const label = dt.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    const key = dt.toISOString().slice(0, 10);
    return [{ m: dt.getUTCMonth() + 1, y: dt.getUTCFullYear(), label, date: key }];
  }, [baseMonth, baseYear]);

  const fetchData = async () => {
    setLoading(true);
    if (!id) return;
    const start = months[0].date;
    const last = new Date(months[0].date + "T00:00:00Z");
    last.setUTCMonth(last.getUTCMonth() + 1);
    const end = last.toISOString().slice(0, 10);

    const res = await fetch(`/api/fees/student?studentId=${encodeURIComponent(id)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    const json = await res.json();
    // find exact record for the selected month date (stored as yyyy-mm-dd)
    const rec = (json.data || []).find((d: any) => d.date === start);
    const paid = !!rec?.paid;
    const rs: MonthRow[] = [{ key: months[0].date, label: months[0].label, date: months[0].date, paid }];
    setRows(rs);
    setLoading(false);
  };

  useEffect(() => {
    // if URL has month/year params (e.g. ?month=1&year=2026), use them as selected month
    try {
      const url = new URL(window.location.href);
      const m = url.searchParams.get("month");
      const y = url.searchParams.get("year");
      if (m) setBaseMonth(parseInt(m, 10));
      if (y) setBaseYear(parseInt(y, 10));
    } catch (e) {
      // ignore
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseMonth, baseYear, id]);

  const togglePaid = async (row: MonthRow) => {
    if (role !== "admin") return; // only admin can toggle
    const newPaid = !row.paid;
    try {
      await fetch("/api/fees/mark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ studentId: id, date: row.date, paid: newPaid }),
      });
      setRows((r) => r.map((x) => (x.key === row.key ? { ...x, paid: newPaid } : x)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Fees</h3>
        <div className="flex items-center gap-2">
          <select value={baseMonth} onChange={(e) => setBaseMonth(parseInt(e.target.value, 10))} className="p-1 border rounded">
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i} value={i + 1}>{new Date(0, i).toLocaleString(undefined, { month: 'long' })}</option>
            ))}
          </select>
          <input type="number" value={baseYear} onChange={(e) => setBaseYear(parseInt(e.target.value || '0', 10))} className="p-1 border rounded w-20" />
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500"><th className="p-2">Month</th><th className="p-2">Status</th><th className="p-2">Action</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b">
                <td className="p-2">{r.label}</td>
                <td className="p-2">{r.paid ? <span className="text-green-600">Paid</span> : <span className="text-red-600">Not paid</span>}</td>
                <td className="p-2">{role === "admin" ? <button className="px-2 py-1 bg-lamaYellow rounded" onClick={() => togglePaid(r)}>{r.paid ? 'Mark unpaid' : 'Mark paid'}</button> : <span className="text-sm text-gray-500">{r.paid ? 'Paid' : 'Not paid'}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
