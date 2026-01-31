import Announcements from "@/components/Announcements";
import RecentResults from "@/components/RecentResults";
import StudentMonthlyAttendance from "@/components/StudentMonthlyAttendance";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

const TeacherPage = async () => {
  const { userId } = auth();
  const teacher = await prisma.teacher.findUnique({ where: { id: userId! }, include: { subjects: true, classes: true } });

  return (
    <div className="p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto w-full flex gap-6 flex-col xl:flex-row items-start">
        <div className="w-full xl:w-2/3">
          <div className="h-full bg-white p-6 rounded-md shadow-sm ring-1 ring-gray-100 flex gap-6">
            <div className="w-40 flex-none">
              <Image
                src={teacher?.img || "/noAvatar.png"}
                alt={`${teacher?.name || ""} ${teacher?.surname || ""}`}
                width={160}
                height={160}
                className="w-40 h-40 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-sky-700">{teacher?.name} {teacher?.surname}</h1>
              <p className="mt-2 text-sm text-slate-600">Teacher profile and assignments overview.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium">Teacher</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">{(teacher?.subjects?.length ?? 0)} Subjects</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm">{(teacher?.classes?.length ?? 0)} Classes</span>
              </div>

              <dl className="profile-info mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Email</dt>
                  <dd className="text-base font-semibold text-slate-700">{teacher?.email || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Phone</dt>
                  <dd className="text-base font-semibold text-slate-700">{teacher?.phone || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Subjects</dt>
                  <dd className="text-base font-semibold text-slate-700">{teacher?.subjects?.map(s => s.name).join(", ") || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Classes</dt>
                  <dd className="text-base font-semibold text-slate-700">{teacher?.classes?.map(c => c.name).join(", ") || "-"}</dd>
                </div>
              </dl>
            </div>
          </div>
         
        </div>
        <div className="w-full xl:w-96">
          <div className="sticky top-6 flex flex-col gap-4">
           
            <div className="bg-white p-4 rounded-md shadow-sm ring-1 ring-gray-100">
              <Announcements />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
