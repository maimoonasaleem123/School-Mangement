import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import Image from "next/image";
import ResultRow from "@/components/ResultRow";

import { auth } from "@clerk/nextjs/server";

type ResultList = {
  id: number;
  title: string;
  studentName: string;
  studentSurname: string;
  teacherName: string;
  teacherSurname: string;
  score: number;
  className: string;
  startTime: Date;
};


const ResultListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {

const { userId, sessionClaims } = auth();
const role = (sessionClaims?.metadata as { role?: string })?.role;
const currentUserId = userId;


const columns = [
  {
    header: "Title",
    accessor: "title",
  },
  {
    header: "Student",
    accessor: "student",
  },
  {
    header: "Score",
    accessor: "score",
    className: "hidden md:table-cell",
  },
  {
    header: "Teacher",
    accessor: "teacher",
    className: "hidden md:table-cell",
  },
  {
    header: "Class",
    accessor: "class",
    className: "hidden md:table-cell",
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
  },
  ...(role === "admin" || role === "teacher"
    ? [
        {
          header: "Actions",
          accessor: "action",
        },
      ]
    : []),
];

const renderRow = (item: any) => {
  return <ResultRow key={item.id} group={item} role={role} />;
};

  const { page, ...queryParams } = searchParams;

  const p = page ? parseInt(page) : 1;

  // URL PARAMS CONDITION

  const query: Prisma.ResultWhereInput = {};

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        switch (key) {
          case "studentId":
            query.studentId = value;
            break;
          case "search":
            query.OR = [
              { exam: { title: { contains: value, mode: "insensitive" } } },
              { student: { name: { contains: value, mode: "insensitive" } } },
            ];
            break;
          default:
            break;
        }
      }
    }
  }

  // ROLE CONDITIONS

  switch (role) {
    case "admin":
      break;
    case "teacher":
      query.OR = [
        { exam: { lesson: { teacherId: currentUserId! } } },
        { assignment: { lesson: { teacherId: currentUserId! } } },
        { teacherId: currentUserId! },
      ];
      break;

    case "student":
      query.studentId = currentUserId!;
      break;

    case "parent":
      query.student = {
        parentId: currentUserId!,
      };
      break;
    default:
      break;
  }

  const [dataRes, count] = await prisma.$transaction([
    prisma.result.findMany({
      where: query,
      include: {
        student: { select: { name: true, surname: true } },
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
        exam: {
          include: {
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
        assignment: {
          include: {
            lesson: {
              select: {
                class: { select: { name: true } },
                teacher: { select: { name: true, surname: true } },
              },
            },
          },
        },
      },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.result.count({ where: query }),
  ]);

  const teachers = await prisma.teacher.findMany({ select: { id: true, name: true, surname: true } });

  // Group individual Result rows (one per subject) into a single summary row per submission
  const groups = new Map<string, any>();

  dataRes.forEach((item) => {
    const title = item.title ?? item.exam?.title ?? item.assignment?.title ?? item.subject?.name ?? "Result";
    const studentId = item.studentId;
    const examId = (item as any).examId ?? "";
    const classId = (item as any).classId ?? item.class?.id ?? "";
    const key = `${studentId}::${title}::${examId}::${classId}`;

    if (!groups.has(key)) {
      // resolve teacher name preferring explicit result.teacherId, then exam/assignment teacher
      const resolvedTeacherId = item.teacherId ?? item.exam?.lesson?.teacher?.id ?? item.assignment?.lesson?.teacher?.id ?? null;
      const resolvedTeacher = teachers.find((t) => t.id === resolvedTeacherId) || null;
      const resolvedTeacherName = resolvedTeacher ? `${resolvedTeacher.name} ${resolvedTeacher.surname}` : (item.exam?.lesson?.teacher?.name ?? item.assignment?.lesson?.teacher?.name ?? "");

      groups.set(key, {
        id: key,
        title,
        studentId,
        studentName: item.student?.name ?? "",
        studentSurname: item.student?.surname ?? "",
        teacherId: resolvedTeacherId,
        teacherName: resolvedTeacherName,
        teacherSurname: resolvedTeacher ? resolvedTeacher.surname : (item.exam?.lesson?.teacher?.surname ?? item.assignment?.lesson?.teacher?.surname ?? ""),
        classId: (item as any).classId ?? item.class?.id ?? null,
        className: item.exam?.lesson?.class?.name ?? item.assignment?.lesson?.class?.name ?? item.class?.name ?? "",
        startTime: item.exam?.startTime ?? item.assignment?.startDate ?? null,
        children: [],
        totalScore: 0,
        totalPossible: 0,
        percent: 0,
        grade: "",
        availableTeachers: teachers,
      });
    }

    const g = groups.get(key);
    const subj = item.subject?.name ?? (item.exam?.title ?? item.assignment?.title ?? "");
    const score = item.score ?? 0;
    const total = (item as any).total ?? 0;
    const percent = (item as any).percent ?? (total ? Math.round((score / total) * 100) : 0);
    const grade = item.grade ?? "";
    const createdAt = (item as any).createdAt ?? null;
    const childTeacherId = item.teacherId ?? item.exam?.lesson?.teacher?.id ?? item.assignment?.lesson?.teacher?.id ?? null;
    const childTeacher = teachers.find((t) => t.id === childTeacherId) || null;
    const childTeacherName = childTeacher ? `${childTeacher.name} ${childTeacher.surname}` : (item.exam?.lesson?.teacher?.name ?? item.assignment?.lesson?.teacher?.name ?? null);

    g.children.push({
      id: item.id,
      subject: subj,
      subjectId: item.subject?.id ?? null,
      examId: (item as any).examId ?? null,
      assignmentId: (item as any).assignmentId ?? null,
      classId: (item as any).classId ?? item.class?.id ?? null,
      studentId: item.studentId,
      score,
      total,
      percent,
      grade,
      createdAt,
      teacherId: childTeacherId,
      teacherName: childTeacherName,
    });

    g.totalScore += score;
    g.totalPossible += total;

    // set group createdAt as earliest createdAt seen
    if (createdAt) {
      if (!g.createdAt) g.createdAt = createdAt;
      else if (new Date(createdAt) < new Date(g.createdAt)) g.createdAt = createdAt;
    }
  });

  const data = Array.from(groups.values()).map((g) => {
    const percent = g.totalPossible ? Math.round((g.totalScore / g.totalPossible) * 100) : 0;
    // derive simple grade from percent if not set
    let grade = g.grade;
    if (!grade) {
      if (percent >= 80) grade = "A+";
      else if (percent >= 70) grade = "A";
      else if (percent >= 60) grade = "B";
      else if (percent >= 50) grade = "C";
      else if (percent >= 40) grade = "D";
      else grade = "F";
    }

    return {
      ...g,
      percent,
      grade,
      totalScore: g.totalScore,
    };
  });

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Results</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {(role === "admin" || role === "teacher") && (
              <FormContainer table="result" type="create" />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default ResultListPage;
