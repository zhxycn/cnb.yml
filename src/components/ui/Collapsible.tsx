"use client";

import { type ReactNode, useState } from "react";

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}

export function Collapsible({
  title,
  defaultOpen = false,
  children,
  actions,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      <div className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <svg
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="truncate">{title}</span>
        </button>
        {actions && <div className="shrink-0 ml-2">{actions}</div>}
      </div>
      {open && <div className="px-3 py-3 space-y-3">{children}</div>}
    </div>
  );
}
