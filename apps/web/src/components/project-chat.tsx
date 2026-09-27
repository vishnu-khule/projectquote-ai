"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listChatMessages,
  sendChatMessage,
  streamChatMessage,
  type ChatMessageDto,
} from "@/lib/api";

type Props = {
  projectId: string;
  accessToken: string;
};

export function ProjectChat({ projectId, accessToken }: Props) {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const list = await listChatMessages(accessToken, projectId);
    setMessages(list);
  }, [accessToken, projectId]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setLoading(true);
    setStreamingText("");

    const optimisticUser: ChatMessageDto = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    const useStream = true;
    try {
      if (useStream) {
        await streamChatMessage(accessToken, projectId, text, {
          onToken: (t) => setStreamingText((s) => s + t),
          onDone: () => {
            setStreamingText("");
            refresh();
          },
          onError: (msg) => setError(msg),
        });
      } else {
        const result = await sendChatMessage(accessToken, projectId, text);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: result.reply,
            metadata: { agent: result.agent },
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">AI assistant</h2>
        <p className="text-xs text-slate-500">
          Describe the job; the agent will ask for missing details.
        </p>
      </div>

      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !streamingText && (
          <p className="text-sm text-slate-500">
            Example: &quot;Modular kitchen 10x12 ft, laminate finish, Pune.&quot;
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-8 rounded-lg bg-brand-50 px-3 py-2 text-sm text-slate-800"
                : "mr-8 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800"
            }
          >
            {m.content}
          </div>
        ))}
        {streamingText && (
          <div className="mr-8 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
            {streamingText}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 text-sm text-red-600" role="alert">{error}</p>
      )}

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-100 p-3">
        <input
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Describe your project…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </section>
  );
}
