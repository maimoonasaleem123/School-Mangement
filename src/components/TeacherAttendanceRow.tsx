"use client";

import { useEffect, useState } from "react";

type Props = {
  student: any;
  lessonId: number;
  date: string; // yyyy-mm-dd
};

export default function TeacherAttendanceRow({ student, lessonId, date }: Props) {
  const [status, setStatus] = useState<'present' | 'absent' | 'none'>('none');
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/attendance/check?studentId=${encodeURIComponent(student.id)}&lessonId=${lessonId}&date=${date}`);
      const json = await res.json();
      if (json.data) setStatus(json.data.present ? 'present' : 'absent');
      else setStatus('none');
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, lessonId, date]);
  // toast
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });
  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const mark = async (present: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, lessonId, present, date }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus(present ? 'present' : 'absent');
        // show a small toast on success
        showToast(present ? 'Marked present' : 'Marked absent');
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const unmark = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/unmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, lessonId, date }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('none');
        showToast('Unmarked attendance');
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center gap-2 relative">
      <div className="mr-4">
        <div className="font-medium">{student.name} {student.surname}</div>
        <div className="text-xs text-gray-400">{student.class ? student.class.name : ''}</div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => (status === 'present' ? unmark() : mark(true))}
          disabled={loading}
          className={`px-3 py-1 rounded text-white ${status === 'present' ? 'bg-green-900' : 'bg-green-500 hover:bg-green-900'}`}
        >
          Present
        </button>
        <button
          onClick={() => (status === 'absent' ? unmark() : mark(false))}
          disabled={loading}
          className={`px-3 py-1 rounded text-white ${status === 'absent' ? 'bg-red-900' : 'bg-red-500 hover:bg-red-900'}`}
        >
          Absent
        </button>
      </div>
      {toast.show && (
        <div className="absolute right-0 top-0 mt-[-2rem]">
          <div className="bg-green-600 text-white px-3 py-1 rounded shadow">{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
