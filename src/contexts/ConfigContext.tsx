"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { tryParseYaml } from "@/lib/yaml-parser";
import { blocksToYaml } from "@/lib/yaml-serializer";
import type { BlockTemplate, PipelineBlock } from "@/types/cnb";

let blockIdCounter = 0;
function newBlockId(): string {
  return `blk-${Date.now()}-${++blockIdCounter}`;
}

export interface RemovedZone {
  afterLine: number;
  text: string;
}

export interface DiffState {
  beforeYaml: string;
  addedLines: number[];
  removedZones: RemovedZone[];
}

interface ConfigState {
  blocks: PipelineBlock[];
  selectedBlockId: string | null;
  yamlText: string;
  yamlError: string | null;
  editSource: "form" | "yaml";
  diffState: DiffState | null;
}

interface ConfigActions {
  addBlock: (template: BlockTemplate) => void;
  addBlankBlock: () => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, patch: Partial<PipelineBlock>) => void;
  selectBlock: (id: string | null) => void;
  updateYamlText: (text: string) => void;
  importYaml: (text: string) => string | null;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  applyDiffToEditor: (
    newYaml: string,
    addedLines: number[],
    removedZones: RemovedZone[],
  ) => void;
  acceptDiff: () => void;
  rejectDiff: () => void;
}

const ConfigCtx = createContext<(ConfigState & ConfigActions) | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [blocks, setBlocks] = useState<PipelineBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [yamlText, setYamlText] = useState("# 从左侧添加流水线片段开始配置\n");
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [diffState, setDiffState] = useState<DiffState | null>(null);
  const editSourceRef = useRef<"form" | "yaml">("form");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const syncYamlFromBlocks = useCallback((newBlocks: PipelineBlock[]) => {
    const text = blocksToYaml(newBlocks);
    setYamlText(text);
    setYamlError(null);
  }, []);

  const addBlock = useCallback(
    (template: BlockTemplate) => {
      const block: PipelineBlock = {
        ...template.defaultBlock,
        id: newBlockId(),
        templateId: template.id,
        pipeline: JSON.parse(JSON.stringify(template.defaultBlock.pipeline)),
      };
      setBlocks((prev) => {
        const next = [...prev, block];
        editSourceRef.current = "form";
        syncYamlFromBlocks(next);
        return next;
      });
      setSelectedBlockId(block.id);
    },
    [syncYamlFromBlocks],
  );

  const addBlankBlock = useCallback(() => {
    const block: PipelineBlock = {
      id: newBlockId(),
      branch: "main",
      event: "push",
      pipeline: {
        stages: [{ name: "step-1", script: 'echo "hello world"' }],
      },
    };
    setBlocks((prev) => {
      const next = [...prev, block];
      editSourceRef.current = "form";
      syncYamlFromBlocks(next);
      return next;
    });
    setSelectedBlockId(block.id);
  }, [syncYamlFromBlocks]);

  const removeBlock = useCallback(
    (id: string) => {
      setBlocks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        editSourceRef.current = "form";
        syncYamlFromBlocks(next);
        return next;
      });
      setSelectedBlockId((prev) => (prev === id ? null : prev));
    },
    [syncYamlFromBlocks],
  );

  const updateBlock = useCallback(
    (id: string, patch: Partial<PipelineBlock>) => {
      setBlocks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
        editSourceRef.current = "form";
        syncYamlFromBlocks(next);
        return next;
      });
    },
    [syncYamlFromBlocks],
  );

  const selectBlock = useCallback((id: string | null) => {
    setSelectedBlockId(id);
  }, []);

  const updateYamlText = useCallback((text: string) => {
    setYamlText(text);
    editSourceRef.current = "yaml";

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = tryParseYaml(text);
      if ("error" in result) {
        setYamlError(result.error);
      } else {
        setYamlError(null);
        setBlocks((prevBlocks) => {
          const newBlocks = result.blocks;
          return matchBlockIds(prevBlocks, newBlocks);
        });
      }
    }, 500);
  }, []);

  const importYaml = useCallback((text: string): string | null => {
    const result = tryParseYaml(text);
    if ("error" in result) return result.error;
    editSourceRef.current = "form";
    setBlocks(result.blocks);
    setYamlText(text);
    setYamlError(null);
    if (result.blocks.length > 0) {
      setSelectedBlockId(result.blocks[0].id);
    }
    return null;
  }, []);

  const applyDiffToEditor = useCallback(
    (newYaml: string, addedLines: number[], removedZones: RemovedZone[]) => {
      setDiffState({ beforeYaml: yamlText, addedLines, removedZones });
      setYamlText(newYaml);
      editSourceRef.current = "yaml";
      const result = tryParseYaml(newYaml);
      if (!("error" in result)) {
        setYamlError(null);
        setBlocks((prev) => matchBlockIds(prev, result.blocks));
      }
    },
    [yamlText],
  );

  const acceptDiff = useCallback(() => {
    setDiffState(null);
  }, []);

  const rejectDiff = useCallback(() => {
    if (!diffState) return;
    const prev = diffState.beforeYaml;
    setDiffState(null);
    setYamlText(prev);
    editSourceRef.current = "yaml";
    const result = tryParseYaml(prev);
    if (!("error" in result)) {
      setYamlError(null);
      setBlocks((prevBlocks) => matchBlockIds(prevBlocks, result.blocks));
    }
  }, [diffState]);

  const moveBlock = useCallback(
    (fromIndex: number, toIndex: number) => {
      setBlocks((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        editSourceRef.current = "form";
        syncYamlFromBlocks(next);
        return next;
      });
    },
    [syncYamlFromBlocks],
  );

  const value = useMemo(
    () => ({
      blocks,
      selectedBlockId,
      yamlText,
      yamlError,
      editSource: editSourceRef.current,
      diffState,
      addBlock,
      addBlankBlock,
      removeBlock,
      updateBlock,
      selectBlock,
      updateYamlText,
      importYaml,
      moveBlock,
      applyDiffToEditor,
      acceptDiff,
      rejectDiff,
    }),
    [
      blocks,
      selectedBlockId,
      yamlText,
      yamlError,
      diffState,
      addBlock,
      addBlankBlock,
      removeBlock,
      updateBlock,
      selectBlock,
      updateYamlText,
      importYaml,
      moveBlock,
      applyDiffToEditor,
      acceptDiff,
      rejectDiff,
    ],
  );

  return <ConfigCtx.Provider value={value}>{children}</ConfigCtx.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigCtx);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}

function matchBlockIds(
  oldBlocks: PipelineBlock[],
  newBlocks: PipelineBlock[],
): PipelineBlock[] {
  const used = new Set<string>();
  return newBlocks.map((nb) => {
    const match = oldBlocks.find(
      (ob) =>
        !used.has(ob.id) &&
        ob.branch === nb.branch &&
        ob.event === nb.event &&
        ob.pipeline.name === nb.pipeline.name,
    );
    if (match) {
      used.add(match.id);
      return { ...nb, id: match.id, templateId: match.templateId };
    }
    return nb;
  });
}
