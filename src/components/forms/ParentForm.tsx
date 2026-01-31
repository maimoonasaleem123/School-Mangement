"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { parentSchema, ParentSchema } from "@/lib/formValidationSchemas";
import { createParent, updateParent } from "@/lib/actions";
import { useFormState } from "react-dom";
import { Dispatch, SetStateAction, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const ParentForm = ({
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
  } = useForm<ParentSchema>({
    resolver: zodResolver(parentSchema),
  });

  const [state, formAction] = useFormState(
    type === "create" ? createParent : updateParent,
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
      toast(`Parent has been ${type === "create" ? "created" : "updated"}!`);
      setOpen(false);
      router.refresh();
    }
  }, [state, router, type, setOpen]);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create Parent" : "Update Parent"}
      </h1>

      <div className="flex flex-col gap-4">
        <InputField label="Username" name="username" register={register} defaultValue={data?.username} error={errors?.username} />
        <div className="flex gap-4">
          <InputField label="First name" name="name" register={register} defaultValue={data?.name} error={errors?.name} />
          <InputField label="Last name" name="surname" register={register} defaultValue={data?.surname} error={errors?.surname} />
        </div>
        <InputField label="Email" name="email" register={register} defaultValue={data?.email} error={errors?.email} />
        <InputField label="Phone" name="phone" register={register} defaultValue={data?.phone} error={errors?.phone} />
        <InputField label="Address" name="address" register={register} defaultValue={data?.address} error={errors?.address} />
      </div>

      {state.error && <span className="text-red-500">Something went wrong!</span>}
      {data && (
        <InputField
          label="Id"
          name="id"
          defaultValue={data?.id}
          register={register}
          error={errors?.id}
          hidden
        />
      )}
      <button className="bg-blue-400 text-white p-2 rounded-md">{type === "create" ? "Create" : "Update"}</button>
    </form>
  );
};

export default ParentForm;
