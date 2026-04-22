"use client";

import { useCallback, useState } from "react";
import type { ServiceItem } from "@/types/cnb";

interface ServicesEditorProps {
  value: ServiceItem[] | undefined;
  onChange: (value: ServiceItem[] | undefined) => void;
}

const KNOWN_SERVICES = ["docker", "vscode"] as const;

function normalizeItem(item: ServiceItem): {
  name: string;
  options?: Record<string, unknown>;
} {
  return typeof item === "string" ? { name: item } : item;
}

export function ServicesEditor({ value, onChange }: ServicesEditorProps) {
  const items = value ?? [];
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [optionsText, setOptionsText] = useState<string>("");

  const itemMap = new Map(
    items.map((s) => [typeof s === "string" ? s : s.name, s]),
  );

  const toggleKnown = useCallback(
    (svcName: string) => {
      if (itemMap.has(svcName)) {
        const next = items.filter(
          (s) => (typeof s === "string" ? s : s.name) !== svcName,
        );
        onChange(next.length > 0 ? next : undefined);
      } else {
        onChange([...items, svcName]);
      }
    },
    [items, itemMap, onChange],
  );

  const openOptions = useCallback(
    (idx: number) => {
      const item = normalizeItem(items[idx]);
      setOptionsText(
        item.options ? JSON.stringify(item.options, null, 2) : "{\n  \n}",
      );
      setExpandedIdx(idx);
    },
    [items],
  );

  const saveOptions = useCallback(() => {
    if (expandedIdx === null) return;
    try {
      const parsed = JSON.parse(optionsText);
      const next = [...items];
      const item = normalizeItem(next[expandedIdx]);
      const hasContent =
        parsed && typeof parsed === "object" && Object.keys(parsed).length > 0;
      if (hasContent) {
        next[expandedIdx] = { name: item.name, options: parsed };
      } else {
        next[expandedIdx] = item.name;
      }
      onChange(next);
      setExpandedIdx(null);
    } catch {
      // invalid JSON - keep editor open
    }
  }, [expandedIdx, items, onChange, optionsText]);

  return (
    <div className="space-y-2">
      {/* Quick toggles for known services */}
      <div className="flex flex-wrap gap-2">
        {KNOWN_SERVICES.map((svc) => {
          const active = itemMap.has(svc);
          return (
            <button
              key={svc}
              type="button"
              onClick={() => toggleKnown(svc)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono rounded-md border transition-colors ${
                active
                  ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400"
              }`}
            >
              <span
                className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                  active
                    ? "bg-blue-500 border-blue-500"
                    : "border-zinc-400 dark:border-zinc-500"
                }`}
              >
                {active && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </span>
              {svc}
            </button>
          );
        })}
      </div>

      {/* Detailed service list with options */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, idx) => {
            const normalized = normalizeItem(item);
            const hasOptions =
              normalized.options && Object.keys(normalized.options).length > 0;
            const isExpanded = expandedIdx === idx;

            return (
              <div
                key={idx}
                className="border border-zinc-200 dark:border-zinc-700 rounded-md"
              >
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                    {normalized.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasOptions && !isExpanded && (
                      <span className="text-[10px] text-blue-500 font-medium">
                        options
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        isExpanded ? setExpandedIdx(null) : openOptions(idx)
                      }
                      className="px-1.5 py-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-blue-500 transition-colors"
                    >
                      {isExpanded ? "收起" : "配置选项"}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 space-y-1.5 border-t border-zinc-100 dark:border-zinc-700/50 pt-2">
                    <textarea
                      className="w-full h-24 px-2 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded resize-none focus:ring-1 focus:ring-blue-500 outline-none"
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      placeholder='{"rootlessBuildkitd": {"enabled": true}}'
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-zinc-400">
                        JSON 格式的 service options
                      </p>
                      <button
                        type="button"
                        onClick={saveOptions}
                        className="px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
