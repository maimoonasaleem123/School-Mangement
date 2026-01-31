import FormContainer from "@/components/FormContainer";
import StudentMonthlyAttendance from "@/components/StudentMonthlyAttendance";
import StudentAttendanceCard from "@/components/StudentAttendanceCard";
import dynamic from "next/dynamic";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { notFound } from "next/navigation";

const SingleStudentPage = async ({ params: { id } }: { params: { id: string } }) => {
  const { sessionClaims } = auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: { include: { grade: true } }, parent: true },
  });

  if (!student) return notFound();

  const latestFee = await prisma.fee.findFirst({ where: { studentId: student.id }, orderBy: { date: 'desc' } });

  return (
    <div className="flex-1 p-4 flex flex-col gap-6">
      {/* USER INFO */}
      <div className="bg-lamaSky py-6 px-4 rounded-md flex gap-4">
        <div className="w-1/4">
          <Image
            src={student.img || "/noAvatar.png"}
            alt={`${student.name} ${student.surname}`}
            width={144}
            height={144}
            className="w-36 h-36 rounded-full object-cover"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
              {student.name} {student.surname}
            </h1>
            {role === "admin" && (
              <FormContainer table="student" type="update" data={student} />
            )}
          </div>
          {/* small badges: role, class and fees */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded">Student</span>
            <span className="text-xs bg-white/60 text-gray-700 px-2 py-0.5 rounded">{student.class.name}{student.class.grade ? ` • Grade ${student.class.grade.level}` : ''}</span>
            {latestFee ? (
              <span className={`text-xs px-2 py-0.5 rounded ${latestFee.paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Fees: {latestFee.paid ? 'Paid' : 'Not paid'}
              </span>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-gray-500">Email</div>
              <div className="font-medium">{student.email || "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">Phone</div>
              <div className="font-medium">{student.phone || "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">CNIC</div>
              <div className="font-medium">{(student as any).cnic || "-"}</div>
            </div>
            <div>
              <div className="text-gray-500">Date of Birth</div>
              <div className="font-medium">
                {student.birthday
                  ? new Intl.DateTimeFormat("en-GB").format(student.birthday)
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Class</div>
              <div className="font-medium">
                {student.class.name}
                {student.class.grade ? ` - Grade ${student.class.grade.level}` : ""}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Parent</div>
              <div className="font-medium">
                {student.parent ? `${student.parent.name} ${student.parent.surname}` : "-"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Parent Phone</div>
              <div className="font-medium">{student.parent?.phone || "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ATTENDANCE */}
      <div className="flex gap-6">
        <div className="w-1/4 bg-white p-4 rounded-md">
          <StudentAttendanceCard id={student.id} />
          <div className="mt-4">
            {/* Fees panel */}
            {['admin','teacher','student'].includes(role || '') ? (
              (() => {
                const StudentFees = dynamic(() => import("@/components/StudentFees"), { ssr: false });
                return <StudentFees id={student.id} role={role} />;
              })()
            ) : null}
          </div>
        </div>
        <div className="flex-1 bg-white p-4 rounded-md">
          <StudentMonthlyAttendance id={student.id} />
        </div>
      </div>
      <div className="mt-6">
        {/* Client component: StudentFees */}
          {/* eslint-disable-next-line react/jsx-no-undef */}
          {/* We'll import dynamically in the client via component file usage in layout */}
      </div>
    </div>
  );
};

export default SingleStudentPage;
