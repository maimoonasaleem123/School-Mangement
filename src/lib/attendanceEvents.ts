type AttendanceEvent = {
  studentId: string;
  lessonId: number;
  present: boolean;
  date: string; // yyyy-mm-dd
};

const subscribers = new Set<(ev: AttendanceEvent) => void>();

export function subscribe(fn: (ev: AttendanceEvent) => void) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function publishAttendanceEvent(ev: AttendanceEvent) {
  for (const fn of Array.from(subscribers)) {
    try {
      fn(ev);
    } catch (e) {
      // ignore subscriber errors
    }
  }
}
