"use client";

import type { editor as MonacoEditor } from "monaco-editor";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConfig } from "@/contexts/ConfigContext";

const MonacoEditorComponent = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false },
);

export function YamlEditor() {
  const {
    yamlText,
    yamlError,
    updateYamlText,
    diffState,
    acceptDiff,
    rejectDiff,
  } = useConfig();
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const viewZoneIdsRef = useRef<string[]>([]);

  useEffect(() => setMounted(true), []);

  const handleEditorMount = useCallback(
    (editor: MonacoEditor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
    },
    [],
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (
      diffState &&
      (diffState.addedLines.length > 0 || diffState.removedZones.length > 0)
    ) {
      const addedDecorations = diffState.addedLines.map((lineNum) => ({
        range: {
          startLineNumber: lineNum,
          startColumn: 1,
          endLineNumber: lineNum,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: "diff-added-line",
        },
      }));
      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        addedDecorations,
      );

      const layoutInfo = editor.getLayoutInfo();
      const rawOpts = editor.getOptions();
      let lineH = 19;
      let fontFamily = "monospace";
      let fontSize = 13;
      try {
        for (let i = 55; i < 65; i++) {
          const v = rawOpts.get(i as never) as
            | Record<string, unknown>
            | undefined;
          if (
            v &&
            typeof v === "object" &&
            "lineHeight" in v &&
            "fontFamily" in v
          ) {
            lineH = (v.lineHeight as number) || 19;
            fontFamily = (v.fontFamily as string) || "monospace";
            fontSize = (v.fontSize as number) || 13;
            break;
          }
        }
      } catch {
        /* use defaults */
      }

      editor.changeViewZones((accessor) => {
        for (const id of viewZoneIdsRef.current) {
          accessor.removeZone(id);
        }
        viewZoneIdsRef.current = [];

        for (const zone of diffState.removedZones) {
          const lines = zone.text.split("\n");
          const domNode = document.createElement("div");
          domNode.style.background = "rgba(239, 68, 68, 0.13)";
          domNode.style.paddingLeft = `${layoutInfo.contentLeft}px`;
          domNode.style.fontFamily = fontFamily;
          domNode.style.fontSize = `${fontSize}px`;
          domNode.style.lineHeight = `${lineH}px`;
          domNode.style.opacity = "0.7";

          for (const line of lines) {
            const lineDiv = document.createElement("div");
            lineDiv.style.color = "#ef4444";
            lineDiv.style.textDecoration = "line-through";
            lineDiv.style.whiteSpace = "pre";
            lineDiv.style.height = `${lineH}px`;
            lineDiv.textContent = line || " ";
            domNode.appendChild(lineDiv);
          }

          const id = accessor.addZone({
            afterLineNumber: zone.afterLine,
            heightInLines: lines.length,
            domNode,
          });
          viewZoneIdsRef.current.push(id);
        }
      });
    } else {
      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        [],
      );
      editor.changeViewZones((accessor) => {
        for (const id of viewZoneIdsRef.current) {
          accessor.removeZone(id);
        }
        viewZoneIdsRef.current = [];
      });
    }
  }, [diffState]);

  const _totalChanges = diffState
    ? diffState.addedLines.length +
      diffState.removedZones.reduce((n, z) => n + z.text.split("\n").length, 0)
    : 0;

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
      {diffState && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 shrink-0">
          <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
            NPC 已修改配置 —{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              +{diffState.addedLines.length}
            </span>
            {diffState.removedZones.length > 0 && (
              <>
                {" "}
                <span className="text-red-500 dark:text-red-400">
                  -
                  {diffState.removedZones.reduce(
                    (n, z) => n + z.text.split("\n").length,
                    0,
                  )}
                </span>
              </>
            )}{" "}
            行
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={rejectDiff}
              className="px-2 py-0.5 text-xs rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              撤销
            </button>
            <button
              type="button"
              onClick={acceptDiff}
              className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              接受
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <MonacoEditorComponent
          language="yaml"
          value={yamlText}
          onChange={(value) => updateYamlText(value ?? "")}
          onMount={handleEditorMount}
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
            glyphMargin: false,
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
