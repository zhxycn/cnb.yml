"use client";

import { ChevronRight, Eraser, Loader2, Send, Square } from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useConfig } from "@/contexts/ConfigContext";
import { CNB_DOCS } from "@/lib/cnb-docs";
import { MessageRenderer } from "./MessageRenderer";
import { NpcIcon } from "./NpcIcon";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `你是 CNB（云原生构建平台）的 NPC——流水线配置助手。用户正在使用可视化编辑器配置 .cnb.yml 文件。

你的职责：
- 帮助用户编写、修改、调试 .cnb.yml 流水线配置
- 解释流水线各字段的含义和用法
- 提供最佳实践建议

重要的输出规则：
- 使用中文回答，像一个友善的同事一样与用户交流
- 先用自然语言简要说明你要做什么、为什么这样改，然后再提供代码
- 当用户编辑器中已有配置、且要求修改时，先解释改动思路，然后提供一个 \`\`\`diff 代码块（unified diff 格式：用 - 标记删除行，用 + 标记新增行，用空格开头标记上下文行）。不要输出完整的 yaml 代码块！diff 会自动应用到编辑器并高亮变更行，用户可以在编辑器中选择接受或撤销
- 当用户没有现有配置、或要求生成全新配置时，先解释配置的作用，然后提供 \`\`\`yaml 代码块
- 如果用户只是提问或闲聊，正常对话回答即可，不需要输出代码
- 保持回答简洁精准
- 严格基于下方的 CNB 官方文档来回答，不要编造不存在的配置项

${CNB_DOCS}`;

let msgIdCounter = 0;
function newMsgId(): string {
  return `msg-${Date.now()}-${++msgIdCounter}`;
}

export function AiAssistant({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { yamlText, importYaml, updateYamlText, applyDiffToEditor } =
    useConfig();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: Message = {
        id: newMsgId(),
        role: "user",
        content: content.trim(),
      };
      const assistantMsg: Message = {
        id: newMsgId(),
        role: "assistant",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      const systemContent = yamlText.trim()
        ? `${SYSTEM_PROMPT}\n\n当前编辑器中的 .cnb.yml 内容：\n\`\`\`yaml\n${yamlText}\n\`\`\``
        : SYSTEM_PROMPT;

      const apiMessages = [
        { role: "system", content: systemContent },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: content.trim() },
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.text().catch(() => "请求失败");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: `> 请求出错：${err}` }
                : m,
            ),
          );
          setIsStreaming(false);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setIsStreaming(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const delta =
                parsed.content ?? parsed.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                accumulated += delta;
                const snapshot = accumulated;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: snapshot } : m,
                  ),
                );
              }
            } catch {
              /* skip */
            }
          }
        }
      } catch (e: unknown) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsg.id
                ? { ...m, content: m.content || "> 连接中断，请重试。" }
                : m,
            ),
          );
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [isStreaming, messages, yamlText],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      sendMessage(input);
    },
    [input, sendMessage],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage],
  );

  const handleApplyYaml = useCallback(
    (yaml: string) => {
      const err = importYaml(yaml);
      if (err) updateYamlText(yaml);
    },
    [importYaml, updateYamlText],
  );

  const handleApplyDiff = useCallback(
    (
      newYaml: string,
      addedLines: number[],
      removedZones: { afterLine: number; text: string }[],
    ) => {
      applyDiffToEditor(newYaml, addedLines, removedZones);
    },
    [applyDiffToEditor],
  );

  const clearMessages = useCallback(() => {
    if (isStreaming) stopStreaming();
    setMessages([]);
  }, [isStreaming, stopStreaming]);

  return (
    <div
      className={`h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-700 transition-all duration-200 ${open ? "w-[380px] min-w-[320px]" : "w-0 min-w-0 overflow-hidden border-l-0"}`}
    >
      {open && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 shrink-0">
            <div className="flex items-center gap-2">
              <NpcIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                NPC
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                流水线助手
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={clearMessages}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                title="清空对话"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                title="收起 NPC"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <NpcIcon className="w-10 h-10 text-blue-500/60 mb-3" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  嗨，我是 NPC
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  你的 .cnb.yml 流水线配置助手
                </p>
                <div className="flex flex-col gap-1.5 mt-4 w-full">
                  {[
                    "帮我配置 Docker 构建推送",
                    "如何添加 PR 自动合并？",
                    "优化当前配置",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="px-3 py-2 text-xs text-left text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-100 dark:border-zinc-700/50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[88%] px-3 py-1.5 bg-blue-600 text-white rounded-xl rounded-br-sm text-[13px] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div className="ai-message-content">
                    {msg.content ? (
                      <MessageRenderer
                        content={msg.content}
                        isAnimating={
                          isStreaming &&
                          msg.id === messages[messages.length - 1]?.id
                        }
                        onApplyYaml={handleApplyYaml}
                        onApplyDiff={handleApplyDiff}
                        currentYaml={yamlText}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-zinc-400 text-xs py-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        思考中...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-900">
            <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="问 NPC..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 max-h-20 scrollbar-thin"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="shrink-0 p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                  title="停止"
                >
                  <Square className="w-3.5 h-3.5" fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="shrink-0 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white disabled:text-zinc-500 transition-colors"
                  title="发送"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
