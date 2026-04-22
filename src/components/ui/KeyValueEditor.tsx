"use client";

import { useCallback } from "react";

interface KeyValueEditorProps {
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = "KEY",
  valuePlaceholder = "value",
}: KeyValueEditorProps) {
  const entries = Object.entries(value);

  const handleChange = useCallback(
    (oldKey: string, newKey: string, newValue: string) => {
      const next = { ...value };
      if (oldKey !== newKey) delete next[oldKey];
      next[newKey] = newValue;
      onChange(next);
    },
    [value, onChange],
  );

  const handleRemove = useCallback(
    (key: string) => {
      const next = { ...value };
      delete next[key];
      onChange(next);
    },
    [value, onChange],
  );

  const handleAdd = useCallback(() => {
    const key = `KEY_${Object.keys(value).length + 1}`;
    onChange({ ...value, [key]: "" });
  }, [value, onChange]);

  return (
    <div className="space-y-2">
      {entries.map(([k, v], i) => (
        <div key={`${i}-${k}`} className="flex gap-2 items-center">
          <input
            className="flex-1 px-2 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={k}
            placeholder={keyPlaceholder}
            onChange={(e) => handleChange(k, e.target.value, v)}
          />
          <span className="text-zinc-400">=</span>
          <input
            className="flex-[2] px-2 py-1.5 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={v}
            placeholder={valuePlaceholder}
            onChange={(e) => handleChange(k, k, e.target.value)}
          />
          <button
            type="button"
            onClick={() => handleRemove(k)}
            className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        + 添加变量
      </button>
    </div>
  );
}
