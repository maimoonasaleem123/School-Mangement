"use client";

import { useState } from "react";

export default function ToggleExpand({ targetId, label }: { targetId: string; label?: string }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    setOpen((s) => !s);
    try {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.classList.toggle("hidden");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button type="button" onClick={toggle} className="flex items-center gap-2">
      <span className="text-sm text-primary-600">{open ? "▾" : "▸"}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}
