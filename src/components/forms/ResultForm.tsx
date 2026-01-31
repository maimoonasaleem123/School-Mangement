"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import InputField from "../InputField";
import { useFormState } from "react-dom";
import { createResult, updateResult } from "@/lib/actions";
import { useEffect, Dispatch, SetStateAction, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

type MarkField = {
  id?: string;
  resultId?: string | null;
  subjectId?: string;
  newSubjectName?: string;
  score?: string;
  total?: string;
  grade?: string;
};

const ResultForm = ({ type, data, setOpen, relatedData }: { type: "create" | "update"; data?: any; setOpen: Dispatch<SetStateAction<boolean>>; relatedData?: any }) => {
  // normalize incoming marks so select/default inputs receive strings and DB ids are preserved
  const normalizedMarks = (data?.marks ?? [{ subjectId: "", newSubjectName: "", score: "", total: "", grade: "" }]).map((m: any) => ({
    resultId: m.id ?? m.dbId ?? null,
    subjectId: m.subjectId != null ? String(m.subjectId) : "",
    newSubjectName: m.newSubjectName ?? "",
    score: m.score != null ? String(m.score) : "",
    total: m.total != null ? String(m.total) : "",
    grade: m.grade ?? "",
  }));

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<any>({
    resolver: undefined,
    defaultValues: {
      marks: normalizedMarks,
      studentId: data?.studentId ?? "",
      classId: data?.classId ?? "",
      title: data?.title ?? "",
      teacherId: data?.teacherId ?? "",
    },
  });

  const { fields, append, remove } = useFieldArray<{ marks: MarkField[] }, "marks">({ control, name: "marks" });

  const [state, formAction] = useFormState(type === "create" ? createResult : updateResult, { success: false, error: false });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) {
      toast(`Result has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const onSubmit = handleSubmit((form) => {
    console.log("Submitting result form: ", form);
    formAction(form);
  });

  const onGenerateAndSave = async () => {
    setClientError(null);
    const values = (watch() as any) || {};
    const studentId = values.studentId;
    const marks = values.marks || [];
    if (!studentId) return setClientError("Please select a student");
    if (!Array.isArray(marks) || marks.length === 0) return setClientError("Add at least one subject mark");

    // validate marks
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i];
      const score = Number(m.score ?? "");
      const total = Number(m.total ?? "");
      if (Number.isNaN(score) || Number.isNaN(total)) return setClientError(`Row ${i + 1}: score and total must be numbers`);
      if (total <= 0) return setClientError(`Row ${i + 1}: total must be greater than zero`);
      if (!m.subjectId && !m.newSubjectName) return setClientError(`Row ${i + 1}: choose a subject or add a new one`);
    }

    // compute overall and set grades if missing
    let totalScore = 0;
    let totalPossible = 0;
    const payloadMarks = marks.map((m: any) => {
      const score = Number(m.score);
      const total = Number(m.total);
      totalScore += score;
      totalPossible += total;
      const percent = total > 0 ? Math.round((score / total) * 100) : null;
      const grade = m.grade && String(m.grade).trim() ? String(m.grade) : (percent !== null ? (percent >= 80 ? "A+" : percent >= 70 ? "A" : percent >= 60 ? "B" : percent >= 50 ? "C" : percent >= 40 ? "D" : "F") : null);
      return {
        id: m.resultId || m.id || undefined,
        subjectId: m.subjectId,
        newSubjectName: m.newSubjectName,
        score: String(score),
        total: String(total),
        grade,
        // include selected teacher for each mark so DB persists teacherId
        teacherId: values.teacherId || undefined,
        title: values.title || undefined,
      };
    });

    const overallPercent = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : null;
    const overallGrade = overallPercent !== null ? (overallPercent >= 80 ? "A+" : overallPercent >= 70 ? "A" : overallPercent >= 60 ? "B" : overallPercent >= 50 ? "C" : overallPercent >= 40 ? "D" : "F") : null;

    const payload = {
      studentId,
      classId: values.classId || undefined,
      examId: values.examId || undefined,
      title: values.title || undefined,
      teacherId: values.teacherId || undefined,
      marks: payloadMarks,
      overallPercent,
      overallGrade,
    };

    try {
      setLoading(true);
      await formAction(payload);
    } catch (e: any) {
      console.error(e);
      setClientError(e?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const { students = [], exams = [], subjects = [], classes = [], teachers = [], role: currentRole = null, currentUserId = null } = relatedData || {};

  const [computedPercent, setComputedPercent] = useState<number | null>(null);
  const [computedGrade, setComputedGrade] = useState<string | null>(null);
  const [addingSubject, setAddingSubject] = useState(false);

  const watchedScore = Number(watch("score") ?? data?.score ?? 0);
  const watchedTotal = Number(watch("total") ?? data?.total ?? 0);
  const watchedStudent = watch("studentId") ?? data?.studentId;

  // compute overall percent/grade from marks array
  useEffect(() => {
    const marks = watch("marks") || [];
    let totalScore = 0;
    let totalPossible = 0;
    for (const m of marks) {
      const s = Number(m?.score ?? 0);
      const t = Number(m?.total ?? 0);
      if (!isNaN(s) && !isNaN(t) && t > 0) {
        totalScore += s;
        totalPossible += t;
      }
    }
    if (totalPossible > 0) {
      const p = Math.round((totalScore / totalPossible) * 100);
      setComputedPercent(p);
      setComputedGrade(p >= 80 ? "A+" : p >= 70 ? "A" : p >= 60 ? "B" : p >= 50 ? "C" : p >= 40 ? "D" : "F");
    } else {
      setComputedPercent(null);
      setComputedGrade(null);
    }
  }, [watch]);

  // when student changes, auto-fill classId if available
  useEffect(() => {
    const student = students.find((s: any) => s.id === watchedStudent);
    if (student?.class?.id) {
      setValue("classId", student.class.id);
    }
  }, [watchedStudent, students, setValue]);

  // auto-fill teacher for teacher role
  useEffect(() => {
    if (currentRole === "teacher" && currentUserId) {
      setValue("teacherId", currentUserId);
    }
  }, [currentRole, currentUserId, setValue]);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">{type === "create" ? "Add Result" : "Update Result"}</h1>
      <InputField label="Result title" name="title" defaultValue={data?.title} register={register} error={errors?.title} />

      {state.error && <div className="text-red-500">Failed to save result. Check console for details.</div>}

      <div className="grid grid-cols-1 gap-4">
        {/* Teacher selector: admins can choose, teachers auto-filled */}
        <div>
          <label className="text-xs text-gray-500">Teacher</label>
          {currentRole === "admin" ? (
            <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("teacherId")} defaultValue={data?.teacherId || ""}>
              <option value="">-- select teacher --</option>
              {teachers.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} {t.surname}</option>
              ))}
            </select>
          ) : (
            <input type="text" readOnly value={teachers.find((t: any) => t.id === currentUserId)?.name + " " + teachers.find((t: any) => t.id === currentUserId)?.surname || (currentRole === "teacher" ? "You (teacher)" : "")} className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" />
          )}
        </div>
        
        <div>
          <label className="text-xs text-gray-500">Student</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("studentId") } defaultValue={data?.studentId}>
            {students.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} {s.surname} — {s.class?.name || ""}</option>
            ))}
          </select>
        </div>

        {/* Assessment/exam removed per UX request */}

        <div>
          <label className="text-xs text-gray-500">Marks</label>
          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="grid grid-cols-12 gap-2 items-end">
                {/* preserve DB id so updateResult can target the correct rows (stored as resultId) */}
                    <input type="hidden" {...register(`marks.${idx}.resultId`)} defaultValue={(f as any).resultId ?? ""} />
                <div className="col-span-5">
                  <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register(`marks.${idx}.subjectId`)} defaultValue={String((f as any).subjectId ?? "")} onChange={(e) => setAddingSubject(e.target.value === "__new") }>
                    <option value="">-- select subject --</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="__new">+ Add new...</option>
                  </select>
                  {watch(`marks.${idx}.subjectId`) === "__new" && (
                    <InputField label="New subject name" name={`marks.${idx}.newSubjectName`} defaultValue={""} register={register} error={(errors as any)?.marks?.[idx]?.newSubjectName} />
                  )}
                </div>
                <div className="col-span-2">
                  <InputField label="Score" name={`marks.${idx}.score`} defaultValue={(f as any).score} register={register} error={(errors as any)?.marks?.[idx]?.score} />
                </div>
                <div className="col-span-2">
                  <InputField label="Total" name={`marks.${idx}.total`} defaultValue={(f as any).total} register={register} error={(errors as any)?.marks?.[idx]?.total} />
                </div>
                <div className="col-span-2 text-sm text-gray-600">
                  <input className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full mb-1" placeholder="Grade (opt)" {...register(`marks.${idx}.grade`)} defaultValue={(f as any).grade || ""} />
                  {/* per-row percent shown below grade for compact layout */}
                  {/* per-row percent */}
                  {(() => {
                    const s = Number(watch(`marks.${idx}.score`) ?? (f as any).score ?? 0);
                    const t = Number(watch(`marks.${idx}.total`) ?? (f as any).total ?? 0);
                    if (t > 0) {
                      const p = Math.round((s / t) * 100);
                      const g = p >= 80 ? "A+" : p >= 70 ? "A" : p >= 60 ? "B" : p >= 50 ? "C" : p >= 40 ? "D" : "F";
                      return <div>{p}% — {g}</div>;
                    }
                    return <div className="text-gray-400">-</div>;
                  })()}
                </div>
                <div className="col-span-1">
                  <button type="button" onClick={() => remove(idx)} className="text-red-600">Remove</button>
                </div>
              </div>
            ))}

            <div>
              <button type="button" onClick={() => append({ subjectId: "", newSubjectName: "", score: "", total: "", grade: "" })} className="text-sm text-primary-600">+ Add subject mark</button>
            </div>
          </div>
        </div>

        {/* hidden classId field - auto-filled from student selection */}
        <input type="hidden" {...register("classId")} defaultValue={data?.classId} />
      </div>
      
      <div className="flex justify-between items-center gap-2">
        <div className="text-sm text-gray-500">Overall: {computedPercent !== null ? `${computedPercent}% • ${computedGrade}` : "-"}</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md border">Cancel</button>
          <button type="button" onClick={onGenerateAndSave} disabled={loading} className="bg-primary-600 disabled:opacity-50 text-white px-4 py-2 rounded-md">{loading ? "Saving..." : (type === "create" ? "Generate & Save" : "Generate & Update")}</button>
        </div>
      </div>
    </form>
  );
};

export default ResultForm;
