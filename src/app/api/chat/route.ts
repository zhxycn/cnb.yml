const UPSTREAM_URL = `${process.env.CNB_API_ENDPOINT}/${process.env.CNB_REPO_SLUG}/-/ai-ide/v2/chat/completions`;
const TOKEN = process.env.CNB_TOKEN ?? "";
const KB_URL = `${process.env.CNB_API_ENDPOINT}/cnb/feedback/-/knowledge/base/query`;

interface KBResult {
  score: number;
  chunk: string;
  metadata: { name: string; path: string; url: string };
}

async function queryKnowledgeBase(question: string): Promise<string> {
  try {
    const res = await fetch(KB_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ query: question, top_k: 4, score_threshold: 0.3 }),
    });
    if (!res.ok) return "";
    const results: KBResult[] = await res.json();
    if (!results.length) return "";
    return results
      .map(
        (r) =>
          `[${r.metadata.name}](${r.metadata.url}) (score: ${r.score.toFixed(2)})\n${r.chunk}`,
      )
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  if (!TOKEN) {
    return Response.json({ error: "AI not configured" }, { status: 503 });
  }

  const body = await req.json();

  const messages: { role: string; content: string }[] = body.messages ?? [];
  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.content ?? "";

  let kbContext = "";
  if (lastUserMsg) {
    kbContext = await queryKnowledgeBase(lastUserMsg);
  }

  if (kbContext && messages.length > 0 && messages[0].role === "system") {
    messages[0] = {
      ...messages[0],
      content:
        messages[0].content +
        `\n\n以下是从 CNB 官方知识库检索到的相关文档（请优先参考这些内容来回答）：\n\n${kbContext}`,
    };
  }

  const upstream = await fetch(UPSTREAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      model: body.model ?? "default",
      messages,
      stream: true,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "upstream error");
    return Response.json({ error: text }, { status: upstream.status });
  }

  const upstreamBody = upstream.body;
  if (!upstreamBody) {
    return Response.json({ error: "no response body" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstreamBody.getReader();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop() ?? "";
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const payload = trimmed.slice(6);
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const parsed = JSON.parse(payload);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content: delta })}\n\n`,
                  ),
                );
              }
            } catch {
              // skip
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
