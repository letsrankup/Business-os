"use client";
import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Write a cold email for a SaaS product",
  "How do I find B2B leads on LinkedIn?",
  "Create a sales pitch for my agency",
  "What's the best way to follow up with prospects?",
  "Write a proposal for a web development project",
  "How to improve my website's SEO?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Salam! 👋 Main aapka AI Business Assistant hoon. Sales, marketing, SEO, proposals, lead generation — kisi bhi cheez mein help karun?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg]
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.error || "Kuch masla hua. Dobara try karein.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_ai",
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "_err",
          role: "assistant",
          content: "⚠️ Network error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Salam! 👋 Main aapka AI Business Assistant hoon. Sales, marketing, SEO, proposals, lead generation — kisi bhi cheez mein help karun?",
        timestamp: new Date(),
      },
    ]);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <AppLayout title="AI Chat">
      <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black">
              AI <span className="text-[#00d9f5]">Chat</span>
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Your business AI assistant — always ready
            </p>
          </div>
          <button
            onClick={clearChat}
            className="text-xs text-gray-500 hover:text-gray-300 border border-white/10 rounded-lg px-3 py-1.5 transition-all hover:border-white/20"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                  msg.role === "user"
                    ? "bg-[#00d9f5] text-black"
                    : "bg-[#1a1a2e] border border-[#00d9f5]/30 text-[#00d9f5]"
                }`}
              >
                {msg.role === "user" ? "U" : "AI"}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#00d9f5] text-black rounded-tr-sm font-medium"
                    : "bg-[#12121a] border border-white/10 text-gray-200 rounded-tl-sm"
                }`}
              >
                {msg.content}
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.role === "user" ? "text-black/50 text-right" : "text-gray-600"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold bg-[#1a1a2e] border border-[#00d9f5]/30 text-[#00d9f5]">
                AI
              </div>
              <div className="bg-[#12121a] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-[#00d9f5] rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Prompts — only show at start */}
        {messages.length <= 1 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="text-xs bg-[#12121a] border border-white/10 rounded-xl px-3 py-2 text-gray-400 hover:text-white hover:border-[#00d9f5]/40 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-3 flex gap-3 items-end mt-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Kuch bhi puchein... (Enter = send, Shift+Enter = new line)"
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-600 text-sm resize-none focus:outline-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 rounded-xl bg-[#00d9f5] text-black flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#00d9f5]/80 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </AppLayout>
  );
         }
