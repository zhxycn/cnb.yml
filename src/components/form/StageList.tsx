"use client";

import { useCallback } from "react";
import type { StageConfig } from "@/types/cnb";
import { StageItem } from "./StageItem";

interface StageListProps {
  stages: StageConfig[];
  onChange: (stages: StageConfig[]) => void;
  label?: string;
}

export function StageList({
  stages,
  onChange,
  label = "Stages",
}: StageListProps) {
  const handleStageChange = useCallback(
    (index: number, stage: StageConfig) => {
      const next = [...stages];
      next[index] = stage;
      onChange(next);
    },
    [stages, onChange],
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(stages.filter((_, i) => i !== index));
    },
    [stages, onChange],
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const next = [...stages];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onChange(next);
    },
    [stages, onChange],
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= stages.length - 1) return;
      const next = [...stages];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onChange(next);
    },
    [stages, onChange],
  );

  const handleAdd = useCallback(() => {
    onChange([...stages, { name: `step-${stages.length + 1}`, script: "" }]);
  }, [stages, onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
        <span className="text-[11px] text-zinc-400">{stages.length} 步</span>
      </div>
      <div className="space-y-2">
        {stages.map((stage, i) => (
          <StageItem
            key={`${i}-${stage.name}`}
            stage={stage}
            index={i}
            onChange={(s) => handleStageChange(i, s)}
            onRemove={() => handleRemove(i)}
            onMoveUp={i > 0 ? () => handleMoveUp(i) : undefined}
            onMoveDown={
              i < stages.length - 1 ? () => handleMoveDown(i) : undefined
            }
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="w-full py-1.5 text-xs text-blue-600 dark:text-blue-400 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
      >
        + 添加步骤
      </button>
    </div>
  );
}
