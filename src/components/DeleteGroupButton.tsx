"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function DeleteGroupButton({ ids }: { ids: number[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!ids || ids.length === 0) return toast.error("No items to delete");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delete-result-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast.success("Submission deleted");
        router.refresh();
      } else {
        toast.error(json?.error || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handle} disabled={loading} className="bg-rose-50 text-rose-600 px-3 py-1 rounded">
      {loading ? "Deleting..." : "Delete Submission"}
    </button>
  );
}
