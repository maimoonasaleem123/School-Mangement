"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createAnnouncement : updateAnnouncement,
    {
      success: false,
      error: false,
    }
  );

  const onSubmit = handleSubmit((d) => {
    formAction(d);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  const classes = relatedData?.classes || [];

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Announcement" : "Update Announcement"}
      </h1>

      <InputField label="Title" name="title" register={register} defaultValue={data?.title} error={errors?.title} />

      <div className="flex flex-col gap-2">
        <label className="text-xs text-gray-500">Description</label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
          {...register("description")}
          defaultValue={data?.description}
          rows={4}
        />
        {errors.description?.message && <p className="text-xs text-red-400">{errors.description.message.toString()}</p>}
      </div>

      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="text-xs text-gray-500">Date</label>
          <input type="date" className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("date")}
            defaultValue={data?.date ? new Date(data.date).toISOString().slice(0,10) : undefined}
          />
          {errors.date?.message && <p className="text-xs text-red-400">{errors.date.message.toString()}</p>}
        </div>
        <div className="w-1/2">
          <label className="text-xs text-gray-500">Class (optional)</label>
          <select className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full" {...register("classId")} defaultValue={data?.classId}>
            <option value={""}>All classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {state.error && <span className="text-red-500">Something went wrong!</span>}
      <button className="bg-blue-400 text-white p-2 rounded-md">{type === "create" ? "Create" : "Update"}</button>
    </form>
  );
};

export default AnnouncementForm;
