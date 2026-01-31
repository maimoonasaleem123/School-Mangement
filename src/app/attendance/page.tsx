import { auth } from "@clerk/nextjs/server";
import StudentMonthlyAttendance from "@/components/StudentMonthlyAttendance";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const AttendancePage = async () => {
  const { userId, sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  if (!userId) {
    redirect("/");
  }

  if (role === "teacher" || role === "admin") {
    // teachers/admins should use the teacher attendance page
    redirect("/list/attendance");
  }

  if (role === "student") {
    return (
      <div className="p-4">
        {/* @ts-ignore Server Component */}
        <StudentMonthlyAttendance id={userId!} />
      </div>
    );
  }

  if (role === "parent") {
    const children = await prisma.student.findMany({ where: { parentId: userId! } });
    return (
      <div className="p-4 space-y-6">
        {children.map((c) => (
          <div key={c.id}>
            <h2 className="font-semibold mb-2">{c.name} {c.surname}</h2>
            {/* @ts-ignore Server Component */}
            <StudentMonthlyAttendance id={c.id} />
          </div>
        ))}
      </div>
    );
  }

  // fallback redirect
  redirect(`/${role}`);
};

export default AttendancePage;
