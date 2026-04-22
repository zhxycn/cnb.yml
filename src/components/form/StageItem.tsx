"use client";

import { useState } from "react";
import { KeyValueEditor } from "@/components/ui/KeyValueEditor";
import { ScriptEditor } from "@/components/ui/ScriptEditor";
import type { StageConfig } from "@/types/cnb";

interface StageItemProps {
  stage: StageConfig;
  index: number;
  onChange: (stage: StageConfig) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export function StageItem({
  stage,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: StageItemProps) {
  const hasAdvanced =
    !!stage.type ||
    !!stage.image ||
    !!stage.settings ||
    !!stage.env ||
    !!stage.imports ||
    !!stage.exports ||
    !!stage.timeout ||
    !!stage.retry ||
    !!stage.allowFailure ||
    !!stage.if ||
    !!stage.ifModify ||
    !!stage.ifNewBranch ||
    !!stage.lock;

  const [showAdvanced, setShowAdvanced] = useState(hasAdvanced);

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 bg-white dark:bg-zinc-800/50 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-zinc-400 w-5 text-center shrink-0">
          {index + 1}
        </span>
        <input
          className="flex-1 px-2 py-1 text-sm bg-transparent border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={stage.name}
          onChange={(e) => onChange({ ...stage, name: e.target.value })}
          placeholder="步骤名称"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Script (main area) */}
      <ScriptEditor
        value={stage.script ?? stage.commands}
        onChange={(script) => onChange({ ...stage, script })}
      />

      {/* Toggle advanced */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center gap-1"
      >
        <svg
          className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        高级选项
        {hasAdvanced && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        )}
      </button>

      {showAdvanced && (
        <div className="space-y-3 pt-1 border-t border-zinc-100 dark:border-zinc-700/50">
          {/* Type (内置任务) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">
                任务类型 (type)
              </label>
              <input
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                value={stage.type ?? ""}
                onChange={(e) =>
                  onChange({ ...stage, type: e.target.value || undefined })
                }
                placeholder="git:release"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">
                运行镜像 (image)
              </label>
              <input
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                value={
                  typeof stage.image === "string"
                    ? stage.image
                    : typeof stage.image === "object"
                      ? stage.image.name
                      : ""
                }
                onChange={(e) =>
                  onChange({ ...stage, image: e.target.value || undefined })
                }
                placeholder="覆盖 pipeline 镜像"
              />
            </div>
          </div>

          {/* Timeout + Retry + allowFailure */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">
                超时 (timeout)
              </label>
              <input
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                value={stage.timeout ?? ""}
                onChange={(e) =>
                  onChange({ ...stage, timeout: e.target.value || undefined })
                }
                placeholder="1h"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">
                重试 (retry)
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                value={stage.retry ?? ""}
                onChange={(e) =>
                  onChange({
                    ...stage,
                    retry: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="0"
                min={0}
                max={10}
              />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-1.5 text-[11px]">
                <input
                  type="checkbox"
                  checked={!!stage.allowFailure}
                  onChange={(e) =>
                    onChange({
                      ...stage,
                      allowFailure: e.target.checked || undefined,
                    })
                  }
                  className="rounded border-zinc-300"
                />
                允许失败
              </label>
            </div>
          </div>

          {/* Conditional: if */}
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">
              条件执行脚本 (if) — 退出码 0 时执行
            </label>
            <textarea
              className="w-full px-2 py-1.5 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none resize-y min-h-[32px]"
              value={
                Array.isArray(stage.if) ? stage.if.join("\n") : (stage.if ?? "")
              }
              onChange={(e) =>
                onChange({
                  ...stage,
                  if: e.target.value || undefined,
                })
              }
              placeholder='[ "$ENV_VAR" = "true" ]'
              rows={1}
            />
          </div>

          {/* ifModify + ifNewBranch + breakIfModify + skipIfModify */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1 text-[11px]">
                <input
                  type="checkbox"
                  checked={!!stage.ifNewBranch}
                  onChange={(e) =>
                    onChange({
                      ...stage,
                      ifNewBranch: e.target.checked || undefined,
                    })
                  }
                  className="rounded border-zinc-300"
                />
                仅新分支
              </label>
              <label className="flex items-center gap-1 text-[11px]">
                <input
                  type="checkbox"
                  checked={!!stage.breakIfModify}
                  onChange={(e) =>
                    onChange({
                      ...stage,
                      breakIfModify: e.target.checked || undefined,
                    })
                  }
                  className="rounded border-zinc-300"
                />
                源分支更新时终止
              </label>
              <label className="flex items-center gap-1 text-[11px]">
                <input
                  type="checkbox"
                  checked={!!stage.skipIfModify}
                  onChange={(e) =>
                    onChange({
                      ...stage,
                      skipIfModify: e.target.checked || undefined,
                    })
                  }
                  className="rounded border-zinc-300"
                />
                源分支更新时跳过
              </label>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 mb-1 block">
                文件变更时执行 (ifModify)
              </label>
              <input
                className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                value={toArray(stage.ifModify).join(", ")}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  onChange({
                    ...stage,
                    ifModify: arr.length > 0 ? arr : undefined,
                  });
                }}
                placeholder="**/*.js, src/**"
              />
            </div>
          </div>

          {/* Stage env */}
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">
              环境变量 (env)
            </label>
            <KeyValueEditor
              value={stage.env ?? {}}
              onChange={(env) =>
                onChange({
                  ...stage,
                  env: Object.keys(env).length > 0 ? env : undefined,
                })
              }
            />
          </div>

          {/* Stage imports */}
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">
              导入变量 (imports)
            </label>
            <input
              className="w-full px-2 py-1 text-xs font-mono bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              value={toArray(stage.imports).join(", ")}
              onChange={(e) => {
                const arr = e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);
                onChange({
                  ...stage,
                  imports:
                    arr.length === 0
                      ? undefined
                      : arr.length === 1
                        ? arr[0]
                        : arr,
                });
              }}
              placeholder="https://cnb.cool/user/repo/-/blob/main/env.yml"
            />
          </div>

          {/* Stage exports */}
          <div>
            <label className="text-[11px] text-zinc-500 mb-1 block">
              导出变量 (exports) — 将任务输出传递给后续任务
            </label>
            <KeyValueEditor
              value={stage.exports ?? {}}
              onChange={(exports) =>
                onChange({
                  ...stage,
                  exports:
                    Object.keys(exports).length > 0 ? exports : undefined,
                })
              }
              keyPlaceholder="输出别名"
              valuePlaceholder="变量名"
            />
          </div>

          {/* Lock */}
          <label className="flex items-center gap-1.5 text-[11px]">
            <input
              type="checkbox"
              checked={!!stage.lock}
              onChange={(e) =>
                onChange({
                  ...stage,
                  lock: e.target.checked ? true : undefined,
                })
              }
              className="rounded border-zinc-300"
            />
            阶段锁 (lock)
          </label>
        </div>
      )}
    </div>
  );
}
