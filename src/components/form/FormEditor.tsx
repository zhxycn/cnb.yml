"use client";

import { useConfig } from "@/contexts/ConfigContext";
import { BlockFormCard } from "./BlockFormCard";

export function FormEditor() {
  const { blocks, addBlankBlock } = useConfig();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {blocks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-xs">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 font-medium">
              开始配置流水线
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 mb-4">
              从左侧选择常用片段，或直接添加空白流水线
            </p>
            <button
              type="button"
              onClick={addBlankBlock}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              + 添加空白流水线
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {blocks.map((block) => (
            <BlockFormCard key={block.id} block={block} />
          ))}
          <button
            type="button"
            onClick={addBlankBlock}
            className="w-full py-2 text-xs text-blue-600 dark:text-blue-400 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
          >
            + 添加空白流水线
          </button>
        </div>
      )}
    </div>
  );
}
