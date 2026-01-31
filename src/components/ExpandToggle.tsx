"use client";

import { useState } from "react";

export default function ExpandToggle({ id, defaultOpen = false }: { id: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    const el = document.getElementById(`details-${id}`);
    if (!el) return;
    if (open) {
      el.classList.add("hidden");
      setOpen(false);
    } else {
      el.classList.remove("hidden");
      setOpen(true);
    }
  };

  return (
    <button aria-expanded={open} onClick={toggle} className="text-sm text-primary-600 mr-2" title={open ? "Hide details" : "Show details"}>
      {open ? "▾" : "▸"}
    </button>
  );
}
