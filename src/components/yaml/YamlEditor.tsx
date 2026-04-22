"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useConfig } from "@/contexts/ConfigContext";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false },
);

export function YamlEditor() {
  const { yamlText, yamlError, updateYamlText } = useConfig();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-[#1e1e1e]">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-zinc-500">加载编辑器...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <MonacoEditor
          language="yaml"
          value={yamlText}
          onChange={(value) => updateYamlText(value ?? "")}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            tabSize: 2,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            renderLineHighlight: "line",
            padding: { top: 12 },
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        />
      </div>
      {yamlError && (
        <div className="px-3 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 flex items-center gap-2">
          <svg
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="truncate">{yamlError}</span>
        </div>
      )}
    </div>
  );
}
