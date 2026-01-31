"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import {
  ClassSchema,
  ExamSchema,
  StudentSchema,
  SubjectSchema,
  TeacherSchema,
} from "./formValidationSchemas";
import { ParentSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.create({
      data: {
        name: data.name,
        teachers: {
          connect: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.errors?.[0]?.message || err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const updateSubject = async (
  currentState: CurrentState,
  data: SubjectSchema
) => {
  try {
    await prisma.subject.update({
      where: {
        id: data.id,
      },
      data: {
        name: data.name,
        teachers: {
          set: data.teachers.map((teacherId) => ({ id: teacherId })),
        },
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    const message = (err as any)?.errors?.[0]?.message || (err as any)?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const deleteSubject = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    const subjectId = parseInt(id);

    // Find lessons that belong to this subject
    const lessons = await prisma.lesson.findMany({ where: { subjectId }, select: { id: true } });
    const lessonIds = lessons.map((l) => l.id);

    // Use a transaction to remove dependent records in correct order
    await prisma.$transaction(async (tx) => {
      if (lessonIds.length) {
        await tx.attendance.deleteMany({ where: { lessonId: { in: lessonIds } } });
        await tx.exam.deleteMany({ where: { lessonId: { in: lessonIds } } });
        await tx.assignment.deleteMany({ where: { lessonId: { in: lessonIds } } });
        await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });
      }

      await tx.subject.delete({ where: { id: subjectId } });
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.create({
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createGrade = async (currentState: CurrentState, data: any) => {
  try {
    const level = Number(data.level);
    if (!level || Number.isNaN(level)) {
      return { success: false, error: true, message: 'Invalid grade level' };
    }
    await prisma.grade.create({ data: { level } });
    try { revalidatePath('/list/classes'); } catch (e) {}
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.message || 'Internal error';
    return { success: false, error: true, message };
  }
};

export const updateClass = async (
  currentState: CurrentState,
  data: ClassSchema
) => {
  try {
    await prisma.class.update({
      where: {
        id: data.id,
      },
      data,
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteClass = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.class.delete({
      where: {
        id: parseInt(id),
      },
    });

    // revalidatePath("/list/class");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  try {
    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"teacher"}
    });

    await prisma.teacher.create({
      data: {
        id: user.id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          connect: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.errors?.[0]?.message || err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const createParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  try {
    // Parents are not created in Clerk anymore. Generate an internal id and save to DB only.
    const id = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2, 8);

    await prisma.parent.create({
      data: {
        id,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.errors?.[0]?.message || err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const updateParent = async (
  currentState: CurrentState,
  data: ParentSchema
) => {
  if (!data.id) return { success: false, error: true };
  try {
    // Update parent record in database only (no Clerk user updates for parents)
    await prisma.parent.update({
      where: { id: data.id },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone,
        address: data.address,
      },
    });

    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.errors?.[0]?.message || err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const deleteParent = async (currentState: CurrentState, data: FormData) => {
  const id = data.get("id") as string;
  try {
    // Parents no longer have Clerk accounts; only delete DB record.
    await prisma.parent.delete({ where: { id } });
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const updateTeacher = async (
  currentState: CurrentState,
  data: TeacherSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      firstName: data.name,
      lastName: data.surname,
    });

    await prisma.teacher.update({
      where: {
        id: data.id,
      },
      data: {
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        img: data.img || null,
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        subjects: {
          set: data.subjects?.map((subjectId: string) => ({
            id: parseInt(subjectId),
          })),
        },
      },
    });
    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.errors?.[0]?.message || err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const deleteTeacher = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.teacher.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/teachers");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  console.log(data);
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { _count: { select: { students: true } } },
    });

    if (classItem && classItem.capacity === classItem._count.students) {
      return { success: false, error: true };
    }

    // Resolve parentId: allow admin to supply parent username instead of id
    let resolvedParentId: string | undefined = undefined;
    if ((data as any).parentId) {
      const rawParent = (data as any).parentId as string;
      // try find by id
      const byId = await prisma.parent.findUnique({ where: { id: rawParent } }).catch(() => null);
      if (byId) resolvedParentId = byId.id;
      else {
        const byUsername = await prisma.parent.findFirst({ where: { username: rawParent } }).catch(() => null);
        if (byUsername) resolvedParentId = byUsername.id;
        else {
          return { success: false, error: true, message: 'Parent not found' };
        }
      }
    }

    const user = await clerkClient.users.createUser({
      username: data.username,
      password: data.password,
      firstName: data.name,
      lastName: data.surname,
      publicMetadata:{role:"student"}
    });
    try {
      await prisma.student.create({
        data: {
          id: user.id,
          username: data.username,
          name: data.name,
          surname: data.surname,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address,
          cnic: (data as any).cnic || null,
          img: data.img || null,
          bloodType: data.bloodType,
          sex: data.sex,
          birthday: data.birthday,
          gradeId: data.gradeId,
          classId: data.classId,
          parentId: resolvedParentId ?? data.parentId,
        },
      });
    } catch (e) {
      // If DB create fails, remove the created Clerk user to avoid orphan accounts
      try {
        await clerkClient.users.deleteUser(user.id);
      } catch (delErr) {
        console.error("Failed to cleanup Clerk user after student create failure", delErr);
      }
      throw e;
    }

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.errors?.[0]?.message || err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const updateStudent = async (
  currentState: CurrentState,
  data: StudentSchema
) => {
  if (!data.id) {
    return { success: false, error: true };
  }
  try {
    const user = await clerkClient.users.updateUser(data.id, {
      username: data.username,
      ...(data.password && data.password !== "" && { password: data.password }),
      firstName: data.name,
      lastName: data.surname,
    });

    // Resolve parentId (allow username)
    let resolvedParentId: string | undefined = undefined;
    if ((data as any).parentId) {
      const rawParent = (data as any).parentId as string;
      const byId = await prisma.parent.findUnique({ where: { id: rawParent } }).catch(() => null);
      if (byId) resolvedParentId = byId.id;
      else {
        const byUsername = await prisma.parent.findFirst({ where: { username: rawParent } }).catch(() => null);
        if (byUsername) resolvedParentId = byUsername.id;
        else return { success: false, error: true, message: 'Parent not found' };
      }
    }

    await prisma.student.update({
      where: {
        id: data.id,
      },
      data: {
        cnic: (data as any).cnic || null,
        username: data.username,
        name: data.name,
        surname: data.surname,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address,
        ...(typeof (data as any).img !== "undefined"
          ? { img: (data as any).img || null }
          : {}),
        bloodType: data.bloodType,
        sex: data.sex,
        birthday: data.birthday,
        gradeId: data.gradeId,
        classId: data.classId,
        parentId: resolvedParentId ?? data.parentId,
      },
    });
    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.errors?.[0]?.message || err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const deleteStudent = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await clerkClient.users.deleteUser(id);

    await prisma.student.delete({
      where: {
        id: id,
      },
    });

    // revalidatePath("/list/students");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }


    console.log("createExam called with:", data);

    // coerce and validate times
    const start = data.startTime ? new Date(data.startTime as any) : null;
    const end = data.endTime ? new Date(data.endTime as any) : null;
    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      return { success: false, error: true, message: "Invalid start or end time" };
    }
    if (start >= end) {
      return { success: false, error: true, message: "Start time must be before end time" };
    }

    // Resolve lessonId from subjectId + classId when lessonId not provided
    let lessonId: number | undefined = undefined;
    if (data.lessonId) lessonId = Number(data.lessonId);
    else if (data.subjectId && data.classId) {
      const clsId = Number(data.classId);
      const subjId = Number(data.subjectId);
      const lesson = await prisma.lesson.findFirst({ where: { classId: clsId, subjectId: subjId } });
      if (lesson) lessonId = lesson.id;
      else {
        // create a placeholder lesson so exam can be linked and visible by class/subject
        const { userId: currentUserId } = auth();
        const teacherForLesson = currentUserId || (await prisma.teacher.findFirst({ select: { id: true } }))?.id;
        if (teacherForLesson) {
          const createdLesson = await prisma.lesson.create({
            data: {
              name: "Assigned Teacher",
              day: "MONDAY",
              startTime: start,
              endTime: end,
              subjectId: subjId,
              classId: clsId,
              teacherId: teacherForLesson,
            },
          });
          lessonId = createdLesson.id;
        } else {
          return { success: false, error: true, message: "No teacher available to create lesson for this class/subject" };
        }
      }
    }

    await prisma.exam.create({
      data: {
        title: data.title,
        startTime: start,
        endTime: end,
        ...(lessonId ? { lessonId } : {}),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateExam = async (
  currentState: CurrentState,
  data: ExamSchema
) => {
  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    // if (role === "teacher") {
    //   const teacherLesson = await prisma.lesson.findFirst({
    //     where: {
    //       teacherId: userId!,
    //       id: data.lessonId,
    //     },
    //   });

    //   if (!teacherLesson) {
    //     return { success: false, error: true };
    //   }
    // }

    // coerce and validate times
    const start = data.startTime ? new Date(data.startTime as any) : null;
    const end = data.endTime ? new Date(data.endTime as any) : null;
    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      return { success: false, error: true, message: "Invalid start or end time" };
    }

    // Resolve lessonId similarly as create when not provided
    let lessonId: number | undefined = undefined;
    if (data.lessonId) lessonId = Number(data.lessonId);
    else if (data.subjectId && data.classId) {
      const clsId = Number(data.classId);
      const subjId = Number(data.subjectId);
      const lesson = await prisma.lesson.findFirst({ where: { classId: clsId, subjectId: subjId } });
      if (lesson) lessonId = lesson.id;
      else {
        const { userId: currentUserId } = auth();
        const teacherForLesson = currentUserId || (await prisma.teacher.findFirst({ select: { id: true } }))?.id;
        if (teacherForLesson) {
          const createdLesson = await prisma.lesson.create({
            data: {
              name: "Assigned Teacher",
              day: "MONDAY",
              startTime: start,
              endTime: end,
              subjectId: subjId,
              classId: clsId,
              teacherId: teacherForLesson,
            },
          });
          lessonId = createdLesson.id;
        }
      }
    }

    await prisma.exam.update({
      where: {
        id: data.id,
      },
      data: {
        title: data.title,
        startTime: start,
        endTime: end,
        ...(typeof lessonId !== "undefined" ? { lessonId } : {}),
      },
    });

    // revalidatePath("/list/subjects");
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteExam = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;

  // const { userId, sessionClaims } = auth();
  // const role = (sessionClaims?.metadata as { role?: string })?.role;

  try {
    await prisma.exam.delete({
      where: {
        id: parseInt(id),
      },
    });

    try { revalidatePath("/list/subjects"); } catch (e) {}
    return { success: true, error: false };
  }
  catch (err: any) {
    console.log(err);
    const message = err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const createLesson = async (
  currentState: CurrentState,
  data: any
) => {
  try {
    await prisma.lesson.create({
      data: {
        // populate required fields with sensible defaults since form no longer provides them
        name: data.name ?? "Assigned Teacher",
        day: data.day ?? "MONDAY",
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime ? new Date(data.endTime) : new Date(Date.now() + 60 * 60 * 1000),
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    // revalidatePath("/list/lessons");
    try { revalidatePath("/list/lessons"); } catch(e) {}
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateLesson = async (
  currentState: CurrentState,
  data: any
) => {
  if (!data.id) return { success: false, error: true };
  try {
    await prisma.lesson.update({
      where: { id: data.id },
      data: {
        name: data.name ?? "Assigned Teacher",
        day: data.day ?? "MONDAY",
        startTime: data.startTime ? new Date(data.startTime) : new Date(),
        endTime: data.endTime ? new Date(data.endTime) : new Date(Date.now() + 60 * 60 * 1000),
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });
    try { revalidatePath("/list/lessons"); } catch(e) {}
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteLesson = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = data.get("id") as string;
  try {
    await prisma.lesson.delete({ where: { id: parseInt(id) } });
    try { revalidatePath("/list/lessons"); } catch(e) {}
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const createAnnouncement = async (currentState: CurrentState, data: any) => {
  try {
    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        classId: data.classId ? (data.classId === "" ? null : Number(data.classId)) : null,
      },
    });
    try { revalidatePath("/list/announcements"); } catch (e) {}
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const updateAnnouncement = async (currentState: CurrentState, data: any) => {
  if (!data.id) return { success: false, error: true };
  try {
    await prisma.announcement.update({
      where: { id: Number(data.id) },
      data: {
        title: data.title,
        description: data.description,
        date: new Date(data.date),
        classId: data.classId ? (data.classId === "" ? null : Number(data.classId)) : null,
      },
    });
    try { revalidatePath("/list/announcements"); } catch (e) {}
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const deleteAnnouncement = async (currentState: CurrentState, data: FormData) => {
  const id = data.get("id") as string;
  try {
    await prisma.announcement.delete({ where: { id: Number(id) } });
    try { revalidatePath("/list/announcements"); } catch (e) {}
    return { success: true, error: false };
  } catch (err: any) {
    console.log(err);
    const message = err?.message || "Internal error";
    return { success: false, error: true, message };
  }
};

export const createResult = async (currentState: CurrentState, data: any) => {
  try {
    console.log("createResult called with:", JSON.stringify(data));
    // Support bulk marks: if `marks` array is provided, create multiple Result rows
    if (Array.isArray(data.marks) && data.marks.length > 0) {
      const promises: Promise<any>[] = [];
      for (const m of data.marks) {
        const score = parseInt(m.score as any);
        const total = m.total ? parseInt(m.total as any) : null;
        const percent = total ? (score / total) * 100 : null;
        const computedGrade = percent !== null ? (percent >= 80 ? "A+" : percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : percent >= 40 ? "D" : "F") : null;

        // subject handling (existing or create)
        let subjectId: number | null = m.subjectId ? parseInt(m.subjectId) : null;
        if (!subjectId && m.newSubjectName) {
          try {
            const created = await prisma.subject.create({ data: { name: m.newSubjectName } });
            subjectId = created.id;
          } catch (e) {
            const found = await prisma.subject.findUnique({ where: { name: m.newSubjectName } });
            subjectId = found ? found.id : null;
          }
        }

        // class: prefer provided or fall back to student's class
        let classId: number | null = m.classId ? parseInt(m.classId) : null;
        if (!classId && data.studentId) {
          try {
            const st = await prisma.student.findUnique({ where: { id: data.studentId }, select: { classId: true } });
            if (st) classId = st.classId;
          } catch (e) {}
        }

        const gradeToSave = m.grade ? String(m.grade) : computedGrade;

        promises.push(prisma.result.create({
          data: {
            score,
            total: total ?? null,
            percent: percent ?? null,
            grade: gradeToSave ?? null,
            title: m.title ?? data.title ?? null,
            studentId: data.studentId,
            ...(m.teacherId ? { teacherId: m.teacherId } : {}),
            ...(subjectId ? { subjectId } : {}),
            ...(classId ? { classId } : {}),
            ...(m.examId ? { examId: parseInt(m.examId) } : {}),
          },
        }));
      }

      await Promise.all(promises);
      try { revalidatePath("/list/results"); } catch (e) {}
      return { success: true, error: false };
    }

    // fallback: single result flow
    const score = parseInt(data.score as any);
    const total = data.total ? parseInt(data.total as any) : null;
    const percent = total ? (score / total) * 100 : null;
    const computedGrade = percent !== null ? (percent >= 80 ? "A+" : percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : percent >= 40 ? "D" : "F") : null;

    let subjectId: number | null = data.subjectId ? parseInt(data.subjectId) : null;
    if (!subjectId && data.newSubjectName) {
      try {
        const created = await prisma.subject.create({ data: { name: data.newSubjectName } });
        subjectId = created.id;
      } catch (e) {
        const found = await prisma.subject.findUnique({ where: { name: data.newSubjectName } });
        subjectId = found ? found.id : null;
      }
    }

    let classId: number | null = data.classId ? parseInt(data.classId) : null;
    if (!classId && data.studentId) {
      try {
        const st = await prisma.student.findUnique({ where: { id: data.studentId }, select: { classId: true } });
        if (st) classId = st.classId;
      } catch (e) {}
    }

    const gradeToSave = data.grade ? String(data.grade) : computedGrade;

    await prisma.result.create({
      data: {
        score,
        total: total ?? null,
        percent: percent ?? null,
        grade: gradeToSave ?? null,
        title: data.title ?? null,
        studentId: data.studentId,
        ...(data.teacherId ? { teacherId: data.teacherId } : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(classId ? { classId } : {}),
        ...(data.examId ? { examId: parseInt(data.examId) } : {}),
        ...(data.assignmentId ? { assignmentId: parseInt(data.assignmentId) } : {}),
      },
    });
    try { revalidatePath("/list/results"); } catch (e) {}
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const updateResult = async (currentState: CurrentState, data: any) => {
  // Support bulk marks update: if `marks` array provided, update each child by id
  if (Array.isArray(data.marks) && data.marks.length > 0) {
    try {
      const updates: Promise<any>[] = [];
      for (const m of data.marks) {
        if (!m.id) continue;
        const score = parseInt(m.score as any) || 0;
        const total = m.total ? parseInt(m.total as any) : null;
        const percent = total ? (score / total) * 100 : null;
        const computedGrade = percent !== null ? (percent >= 80 ? "A+" : percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : percent >= 40 ? "D" : "F") : null;

        let subjectId: number | null = m.subjectId ? parseInt(m.subjectId) : null;
        if (!subjectId && m.newSubjectName) {
          try {
            const created = await prisma.subject.create({ data: { name: m.newSubjectName } });
            subjectId = created.id;
          } catch (e) {
            const found = await prisma.subject.findUnique({ where: { name: m.newSubjectName } });
            subjectId = found ? found.id : null;
          }
        }

        let classId: number | null = m.classId ? parseInt(m.classId) : null;
        if (!classId && m.studentId) {
          try {
            const st = await prisma.student.findUnique({ where: { id: m.studentId }, select: { classId: true } });
            if (st) classId = st.classId;
          } catch (e) {}
        }

        const gradeToSave = m.grade ? String(m.grade) : computedGrade;

        updates.push(prisma.result.update({
          where: { id: parseInt(m.id) },
          data: {
            score,
            total: total ?? null,
            percent: percent ?? null,
            grade: gradeToSave ?? null,
            studentId: m.studentId ?? undefined,
            ...(m.teacherId ? { teacherId: m.teacherId } : {}),
            ...(subjectId ? { subjectId } : {}),
            ...(classId ? { classId } : {}),
            ...(m.examId ? { examId: parseInt(m.examId) } : {}),
            ...(m.assignmentId ? { assignmentId: parseInt(m.assignmentId) } : {}),
          },
        }));
      }

      await Promise.all(updates);
      try { revalidatePath("/list/results"); } catch (e) {}
      return { success: true, error: false };
    } catch (err) {
      console.log(err);
      return { success: false, error: true };
    }
  }

  if (!data.id) return { success: false, error: true };
  try {
    console.log("updateResult called with:", JSON.stringify(data));
    const score = parseInt(data.score as any);
    const total = data.total ? parseInt(data.total as any) : null;
    const percent = total ? (score / total) * 100 : null;
    const computedGrade = percent !== null ? (percent >= 80 ? "A+" : percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : percent >= 40 ? "D" : "F") : null;

    // handle optional subject creation or selection for update
    let subjectId: number | null = data.subjectId ? parseInt(data.subjectId) : null;
    if (!subjectId && data.newSubjectName) {
      try {
        const created = await prisma.subject.create({ data: { name: data.newSubjectName } });
        subjectId = created.id;
      } catch (e) {
        const found = await prisma.subject.findUnique({ where: { name: data.newSubjectName } });
        subjectId = found ? found.id : null;
      }
    }

    let classId: number | null = data.classId ? parseInt(data.classId) : null;
    if (!classId && data.studentId) {
      try {
        const st = await prisma.student.findUnique({ where: { id: data.studentId }, select: { classId: true } });
        if (st) classId = st.classId;
      } catch (e) {}
    }

    const gradeToSave = data.grade ? String(data.grade) : computedGrade;

    await prisma.result.update({
      where: { id: data.id },
      data: {
        score,
        total: total ?? null,
        percent: percent ?? null,
        grade: gradeToSave ?? null,
        studentId: data.studentId,
        ...(data.teacherId ? { teacherId: data.teacherId } : { teacherId: null }),
        ...(subjectId ? { subjectId } : { subjectId: null }),
        ...(classId ? { classId } : { classId: null }),
        ...(data.examId ? { examId: parseInt(data.examId) } : { examId: null }),
        ...(data.assignmentId ? { assignmentId: parseInt(data.assignmentId) } : { assignmentId: null }),
      },
    });
    try { revalidatePath("/list/results"); } catch (e) {}
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const deleteResult = async (currentState: CurrentState, data: FormData) => {
  const id = data.get("id") as string;
  try {
    await prisma.result.delete({ where: { id: parseInt(id) } });
    try { revalidatePath("/list/results"); } catch (e) {}
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export const markAttendance = async (formData: FormData) => {
  try {
    const studentId = formData.get("studentId") as string;
    const lessonId = parseInt(formData.get("lessonId") as string);
    const presentStr = formData.get("present") as string;
    const dateStr = (formData.get("date") as string) || null;

    const present = presentStr === "true";

    // determine target date (YYYY-MM-DD). If provided, use that date; otherwise use today
    let targetDate: Date;
    if (dateStr) {
      // expecting date input in yyyy-mm-dd
      const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
      // create UTC midnight for that date
      targetDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    }

    const start = new Date(targetDate);
    const end = new Date(targetDate);
    end.setUTCDate(end.getUTCDate() + 1);

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId,
        lessonId,
        date: {
          gte: start,
          lt: end,
        },
      },
    });

    if (existing) {
      await prisma.attendance.update({
        where: { id: existing.id },
        data: { present, date: targetDate },
      });
    } else {
      await prisma.attendance.create({
        data: {
          studentId,
          lessonId,
          present,
          date: targetDate,
        },
      });
    }

    try {
      revalidatePath("/list/attendance");
    } catch (e) {
      // ignore in environments without next cache
    }

    return { success: true };
  } catch (err) {
    console.log("markAttendance error", err);
    return { success: false, error: true };
  }
};
