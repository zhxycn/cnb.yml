"use client";

import { useCallback, useState } from "react";
import { NpcIcon } from "@/components/ai/NpcIcon";
import { useConfig } from "@/contexts/ConfigContext";

interface HeaderProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  npcEnabled?: boolean;
  npcOpen?: boolean;
  onToggleNpc?: () => void;
}

export function Header({
  sidebarOpen,
  onToggleSidebar,
  npcEnabled,
  npcOpen,
  onToggleNpc,
}: HeaderProps) {
  const { yamlText, importYaml } = useConfig();
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(yamlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [yamlText]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([yamlText], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = ".cnb.yml";
    a.click();
    URL.revokeObjectURL(url);
  }, [yamlText]);

  const handleImport = useCallback(() => {
    const err = importYaml(importText);
    if (err) {
      setImportError(err);
    } else {
      setShowImport(false);
      setImportText("");
      setImportError(null);
    }
  }, [importText, importYaml]);

  return (
    <>
      <header className="h-12 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-between px-4 shrink-0 relative z-40">
        <div className="flex items-center gap-2">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              title={sidebarOpen ? "收起片段栏" : "展开片段栏"}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {sidebarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          )}
          <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            CNB 流水线配置
          </h1>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">
            .cnb.yml
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            粘贴导入
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          >
            {copied ? "已复制 ✓" : "复制"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            下载 .cnb.yml
          </button>
          {npcEnabled && onToggleNpc && (
            <button
              type="button"
              onClick={onToggleNpc}
              className={`ml-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition-colors ${
                npcOpen
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              title={npcOpen ? "收起 NPC" : "展开 NPC"}
            >
              <NpcIcon className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">NPC</span>
            </button>
          )}
        </div>
      </header>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-5">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
              粘贴已有的 .cnb.yml 配置
            </h2>
            <textarea
              className="w-full h-64 px-3 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 rounded-lg resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError(null);
              }}
              placeholder="在此粘贴 YAML 内容..."
            />
            {importError && (
              <p className="text-xs text-red-500 mt-2">{importError}</p>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportText("");
                  setImportError(null);
                }}
                className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                导入
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
