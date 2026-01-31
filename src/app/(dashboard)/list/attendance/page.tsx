import prisma from "@/lib/prisma";
import dynamic from "next/dynamic";

const TeacherAttendanceRow = dynamic(() => import("@/components/TeacherAttendanceRow"), { ssr: false });
import { auth } from "@clerk/nextjs/server";
import { markAttendance } from "@/lib/actions";
import Image from "next/image";

const AttendanceListPage = async ({
  searchParams,
}: {
  searchParams: { date?: string; classId?: string; lessonId?: string };
}) => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const selectedDate = searchParams?.date || new Date().toISOString().slice(0, 10);

  // filter lessons by role and optional class/lesson filters
  const lessonQuery: any = {};
  if (role === "teacher") {
    // include lessons assigned to this teacher OR lessons from classes they supervise
    const supervised = await prisma.class.findMany({ where: { supervisorId: userId }, select: { id: true } });
    const supervisedIds = supervised.map((c) => c.id);
    lessonQuery.OR = [{ teacherId: userId }];
    if (supervisedIds.length) lessonQuery.OR.push({ classId: { in: supervisedIds } });
  }
  if (searchParams.classId) lessonQuery.classId = parseInt(searchParams.classId);
  if (searchParams.lessonId) lessonQuery.id = parseInt(searchParams.lessonId);

  const lessons = await prisma.lesson.findMany({
    where: lessonQuery,
    include: {
      class: { include: { students: true } },
      teacher: { select: { name: true, surname: true } },
    },
  });

  // If teacher has no lessons but supervises classes, load those classes for a fallback view
  let supervisedClasses: any[] = [];
  if (role === "teacher") {
    const supervised = await prisma.class.findMany({ where: { supervisorId: userId }, include: { students: true } });
    supervisedClasses = supervised;
  }

  // collate classes and lessons for filters
  const classes = Array.from(new Map(lessons.map((l) => [l.class.id, l.class])).values());

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Attendance</h1>
        <div className="flex items-center gap-2">
          <Image src="/calendar.png" alt="" width={18} height={18} />
          <span>{new Date(selectedDate).toDateString()}</span>
        </div>
      </div>

      <form method="get" className="flex gap-2 items-center mt-4">
        <input
          type="date"
          name="date"
          defaultValue={selectedDate}
          className="p-2 border rounded"
        />
        <select name="classId" defaultValue={searchParams.classId || ""} className="p-2 border rounded">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="lessonId" defaultValue={searchParams.lessonId || ""} className="p-2 border rounded">
          <option value="">All assignments</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} - {l.class.name}
            </option>
          ))}
        </select>
        <button type="submit" className="px-3 py-1 bg-lamaYellow rounded">
          Apply
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-6">
        {lessons.length > 0 ? (
          lessons.map((lesson) => (
            <div key={lesson.id} className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{lesson.class.name}</h2>
                  <p className="text-sm text-gray-500">
                    {lesson.teacher?.name} {lesson.teacher?.surname}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-2">
                {lesson.class.students.map((student) => (
                  <div key={student.id} className="p-2 border rounded">
                    {/* render client row to handle marking via API */}
                    {/* @ts-ignore */}
                    <TeacherAttendanceRow student={student} lessonId={lesson.id} date={selectedDate} />
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // fallback: show supervised classes and students, but prompt to create a lesson to enable marking
          supervisedClasses.map((c) => (
            <div key={`class-${c.id}`} className="p-4 border rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{c.name} (No lessons)</h2>
                  <p className="text-sm text-gray-500">Class supervisor view — create a lesson to enable marking</p>
                </div>
                <div>
                  <a href={`/list/lessons?classId=${c.id}`} className="px-3 py-1 bg-lamaYellow rounded">Create / Assign Lesson</a>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-1 gap-2">
                {c.students.map((student) => (
                  <div key={student.id} className="p-2 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{student.name} {student.surname}</div>
                      <div className="text-xs text-gray-400">{student.username}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button disabled className="px-3 py-1 rounded text-white bg-green-200">Present</button>
                      <button disabled className="px-3 py-1 rounded text-white bg-red-200">Absent</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AttendanceListPage;
