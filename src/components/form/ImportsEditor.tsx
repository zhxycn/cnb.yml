"use client";

import { useCallback, useState } from "react";

interface ImportsEditorProps {
  value: string | string[] | undefined;
  onChange: (value: string[] | undefined) => void;
}

export function ImportsEditor({ value, onChange }: ImportsEditorProps) {
  const items = value ? (Array.isArray(value) ? value : [value]) : [];
  const [draft, setDraft] = useState("");

  const add = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...items, trimmed]);
    setDraft("");
  }, [draft, items, onChange]);

  const remove = useCallback(
    (idx: number) => {
      const next = items.filter((_, i) => i !== idx);
      onChange(next.length > 0 ? next : undefined);
    },
    [items, onChange],
  );

  const update = useCallback(
    (idx: number, val: string) => {
      const next = [...items];
      next[idx] = val;
      onChange(next);
    },
    [items, onChange],
  );

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={`${idx}-${item}`} className="flex gap-1.5">
          <input
            className="flex-1 px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            value={item}
            onChange={(e) => update(idx, e.target.value)}
            placeholder="https://cnb.cool/org/secrets/-/blob/main/.env"
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="px-1.5 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
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
      <div className="flex gap-1.5">
        <input
          className="flex-1 px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="输入 URL 后回车添加"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          添加
        </button>
      </div>
      <p className="text-[10px] text-zinc-400 leading-tight">
        从外部仓库导入环境变量，通常用于引用密钥仓库中的 .env 文件
      </p>
    </div>
  );
}
