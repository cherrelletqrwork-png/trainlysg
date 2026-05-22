"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

const QUICK_REPLIES = [
  "How does Trainly work?",
  "How much does it cost?",
  "How are coaches verified?",
  "Can I become a coach?",
];

const GREETING: Msg = {
  role: "bot",
  text:
    "Hi! 👋 I'm the Trainly assistant. Ask me about coaches, pricing, becoming a coach — anything Trainly. (For complex stuff a real human can help: hello@trainly.sg)",
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      // Slight delay so the dialog has rendered
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || loading) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await r.json();
      const reply =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply
          : "Sorry, I had trouble there. Try emailing hello@trainly.sg.";
      setMessages((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "I can't reach the server right now. Try again in a moment, or email hello@trainly.sg." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Trainly chat assistant"
          className="fixed bottom-5 right-5 z-50 shadow-lift flex items-center gap-2 rounded-full bg-gradient-to-br from-sage-600 to-coral-500 text-white pl-4 pr-5 py-3.5 text-sm font-medium hover:scale-[1.03] active:scale-[0.98] transition"
        >
          <span className="text-lg leading-none">💬</span>
          <span className="hidden sm:inline">Ask Trainly</span>
          <span className="sm:hidden">Chat</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Trainly assistant"
          className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-3rem))] flex flex-col bg-white rounded-2xl shadow-lift border border-ink-100 overflow-hidden fade-up"
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sage-600 to-coral-500 text-white">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex w-9 h-9 rounded-xl bg-white/20 items-center justify-center font-bold">
                T
              </span>
              <div>
                <div className="font-display font-semibold leading-tight">Trainly assistant</div>
                <div className="text-[11px] opacity-80 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage-200 animate-pulse" />
                  Usually replies instantly
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-2xl leading-none px-1"
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          {/* Messages */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-sage-700 text-white rounded-br-sm"
                      : "bg-white border border-ink-100 text-ink-800 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-ink-100 px-3.5 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick replies — only while conversation is fresh */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 pt-2 pb-1 flex flex-wrap gap-1.5 bg-cream border-t border-ink-100">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-white border border-ink-200 text-ink-700 hover:border-sage-400 hover:bg-sage-50 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 p-3 border-t border-ink-100 bg-white"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about coaches, pricing, anything..."
              disabled={loading}
              maxLength={800}
              className="flex-1 rounded-full border border-ink-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300 focus:border-sage-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-sage-700 text-white px-4 py-2 text-sm font-medium hover:bg-sage-800 disabled:opacity-50 transition"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
