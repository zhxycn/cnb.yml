"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StreamdownRenderer } from "./StreamdownRenderer";

interface CodeBlock {
  lang: string;
  code: string;
}

interface RemovedZone {
  afterLine: number;
  text: string;
}

interface Props {
  content: string;
  isAnimating: boolean;
  onApplyYaml?: (yaml: string) => void;
  onApplyDiff?: (
    newYaml: string,
    addedLines: number[],
    removedZones: RemovedZone[],
  ) => void;
  currentYaml?: string;
}

function extractCodeBlocks(markdown: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const re = /```(\w*)\n([\s\S]*?)```/g;
  for (let m = re.exec(markdown); m !== null; m = re.exec(markdown)) {
    blocks.push({ lang: m[1].toLowerCase(), code: m[2].trimEnd() });
  }
  return blocks;
}

export function MessageRenderer({
  content,
  isAnimating,
  onApplyYaml,
  onApplyDiff,
  currentYaml,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const applyYamlRef = useRef(onApplyYaml);
  const applyDiffRef = useRef(onApplyDiff);
  const yamlRef = useRef(currentYaml);
  applyYamlRef.current = onApplyYaml;
  applyDiffRef.current = onApplyDiff;
  yamlRef.current = currentYaml;

  const codeBlocksRef = useRef<CodeBlock[]>([]);
  const [appliedBlocks, setAppliedBlocks] = useState<Record<number, boolean>>(
    {},
  );
  const autoAppliedRef = useRef(false);
  const prevAnimatingRef = useRef(isAnimating);

  useEffect(() => {
    codeBlocksRef.current = extractCodeBlocks(content);
  }, [content]);

  useEffect(() => {
    if (prevAnimatingRef.current && !isAnimating && !autoAppliedRef.current) {
      autoAppliedRef.current = true;
      const blocks = codeBlocksRef.current;

      const diffBlocks = blocks
        .map((b, i) => ({ ...b, idx: i }))
        .filter((b) => b.lang === "diff");

      if (diffBlocks.length > 0 && applyDiffRef.current) {
        const last = diffBlocks[diffBlocks.length - 1];
        const result = computeDiffResult(yamlRef.current ?? "", last.code);
        applyDiffRef.current(
          result.newYaml,
          result.addedLines,
          result.removedZones,
        );
        setAppliedBlocks((prev) => ({ ...prev, [last.idx]: true }));
        return;
      }

      const yamlBlocks = blocks
        .map((b, i) => ({ ...b, idx: i }))
        .filter((b) => b.lang === "yaml" || b.lang === "yml");

      if (yamlBlocks.length > 0 && applyDiffRef.current) {
        const last = yamlBlocks[yamlBlocks.length - 1];
        const oldLines = (yamlRef.current ?? "").split("\n");
        const newLines = last.code.split("\n");
        const added = computeAddedLines(oldLines, newLines);
        applyDiffRef.current(last.code, added, []);
        setAppliedBlocks((prev) => ({ ...prev, [last.idx]: true }));
      }
    }
    prevAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const handleManualApply = useCallback(
    (idx: number, code: string, isDiff: boolean) => {
      if (isDiff && applyDiffRef.current) {
        const result = computeDiffResult(yamlRef.current ?? "", code);
        applyDiffRef.current(
          result.newYaml,
          result.addedLines,
          result.removedZones,
        );
      } else if (applyDiffRef.current) {
        const oldLines = (yamlRef.current ?? "").split("\n");
        const newLines = code.split("\n");
        const added = computeAddedLines(oldLines, newLines);
        applyDiffRef.current(code, added, []);
      } else if (applyYamlRef.current) {
        applyYamlRef.current(code);
      }
      setAppliedBlocks((prev) => ({ ...prev, [idx]: true }));
    },
    [],
  );

  const injectActionBars = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    for (const bar of el.querySelectorAll(".code-action-bar")) {
      bar.remove();
    }

    const preElements = el.querySelectorAll("pre");
    const blocks = codeBlocksRef.current;

    preElements.forEach((pre, idx) => {
      const block = blocks[idx];
      if (!block || !block.lang) return;

      const isYaml = block.lang === "yaml" || block.lang === "yml";
      const isDiff = block.lang === "diff";
      const isApplied = !!appliedBlocks[idx];

      const bar = document.createElement("div");
      bar.className = "code-action-bar";

      const langLabel = document.createElement("span");
      langLabel.className = "code-action-lang";
      langLabel.textContent = block.lang;
      bar.appendChild(langLabel);

      const btnGroup = document.createElement("div");
      btnGroup.className = "code-action-btns";

      const copyBtn = makeBtn("复制", "copy", async () => {
        await navigator.clipboard.writeText(block.code);
        flashBtn(copyBtn, "已复制 ✓");
      });
      btnGroup.appendChild(copyBtn);

      if (
        (isYaml || isDiff) &&
        (applyDiffRef.current || applyYamlRef.current)
      ) {
        if (isApplied) {
          const badge = document.createElement("span");
          badge.className = "code-action-badge";
          badge.textContent = "已应用";
          btnGroup.appendChild(badge);
        } else {
          const label = isDiff ? "应用变更" : "应用到编辑器";
          const applyBtn = makeBtn(label, "apply", () => {
            handleManualApply(idx, block.code, isDiff);
          });
          btnGroup.appendChild(applyBtn);
        }
      }

      bar.appendChild(btnGroup);

      pre.style.borderTopLeftRadius = "0";
      pre.style.borderTopRightRadius = "0";
      pre.style.marginTop = "0";

      const parent = pre.parentElement ?? el;
      parent.insertBefore(bar, pre);
    });
  }, [appliedBlocks, handleManualApply]);

  useEffect(() => {
    if (isAnimating) return;
    const timer = requestAnimationFrame(() => {
      setTimeout(injectActionBars, 30);
    });
    return () => cancelAnimationFrame(timer);
  }, [isAnimating, injectActionBars]);

  return (
    <div ref={containerRef}>
      <StreamdownRenderer content={content} isAnimating={isAnimating} />
    </div>
  );
}

function makeBtn(
  label: string,
  type: "copy" | "apply" | "undo",
  onClick: () => void,
) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = `code-action-btn code-action-btn--${type}`;
  btn.addEventListener("click", onClick);
  return btn;
}

function flashBtn(btn: HTMLButtonElement, text: string) {
  const original = btn.textContent;
  btn.textContent = text;
  btn.classList.add("code-action-btn--success");
  setTimeout(() => {
    btn.textContent = original;
    btn.classList.remove("code-action-btn--success");
  }, 1800);
}

function computeDiffResult(
  _currentYaml: string,
  diff: string,
): { newYaml: string; addedLines: number[]; removedZones: RemovedZone[] } {
  const diffLines = diff.split("\n");
  const resultLines: string[] = [];
  const addedLines: number[] = [];
  const removedZones: RemovedZone[] = [];
  let lineNum = 0;
  let pendingRemovals: string[] = [];

  for (const line of diffLines) {
    if (
      line.startsWith("---") ||
      line.startsWith("+++") ||
      line.startsWith("@@")
    )
      continue;

    if (line.startsWith("-")) {
      pendingRemovals.push(line.slice(1));
      continue;
    }

    if (pendingRemovals.length > 0) {
      removedZones.push({
        afterLine: lineNum,
        text: pendingRemovals.join("\n"),
      });
      pendingRemovals = [];
    }

    lineNum++;
    if (line.startsWith("+")) {
      resultLines.push(line.slice(1));
      addedLines.push(lineNum);
    } else {
      resultLines.push(line.startsWith(" ") ? line.slice(1) : line);
    }
  }

  if (pendingRemovals.length > 0) {
    removedZones.push({ afterLine: lineNum, text: pendingRemovals.join("\n") });
  }

  return { newYaml: resultLines.join("\n"), addedLines, removedZones };
}

function computeAddedLines(oldLines: string[], newLines: string[]): number[] {
  const oldSet = new Set(oldLines.map((l) => l.trimEnd()));
  const added: number[] = [];
  newLines.forEach((line, i) => {
    if (!oldSet.has(line.trimEnd())) {
      added.push(i + 1);
    }
  });
  return added;
}
