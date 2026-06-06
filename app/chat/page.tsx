"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  fileName?: string;
  imagePreview?: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hello! I'm your AI Business Assistant.\n\nI can help you with:\n• Business analysis & strategy\n• Proposals & content writing\n• SEO advice & audits\n• File & PDF analysis\n• Any business question\n\nAttach files (PDF, images, text) or just type your question!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    content: string;
    type: string;
    preview?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    // Image file
    if (file.type.startsWith("image/")) {
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setAttachedFile({
          name: file.name,
          content: `[Image file: ${file.name}]`,
          type: "image",
          preview: base64,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // Text / PDF / CSV / other
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setAttachedFile({
        name: file.name,
        content: content.slice(0, 3000), // max 3000 chars
        type: file.type,
      });
    };
    reader.readAsText(file);
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !attachedFile) return;
    if (isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || "Please analyze the attached file.",
      fileName: attachedFile?.name,
      imagePreview: attachedFile?.preview,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const fileToSend = attachedFile;
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          fileContent: fileToSend?.content || null,
          fileName: fileToSend?.name || null,
        }),
      });

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || data.error || "Something went wrong.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "⚠️ Connection error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! How can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  const formatContent = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111]">
        <div>
          <h1 className="text-xl font-bold text-white">
            💬 AI Chat{" "}
            <span className="text-[#00d4aa]">Workspace</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Powered by OpenRouter AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[#00d4aa] bg-[#00d4aa]/10 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
            AI Active
          </span>
          <button
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-all"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] ${
                msg.role === "user" ? "items-end" : "items-start"
              } flex flex-col gap-1`}
            >
              {/* Avatar + Name */}
              <div
                className={`flex items-center gap-2 ${
                  msg.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    msg.role === "user"
                      ? "bg-[#00d4aa] text-black"
                      : "bg-gray-700 text-white"
                  }`}
                >
                  {msg.role === "user" ? "U" : "AI"}
                </div>
                <span className="text-xs text-gray-500">
                  {msg.role === "user" ? "You" : "AI Assistant"}
                </span>
              </div>

              {/* Image Preview */}
              {msg.imagePreview && (
                <img
                  src={msg.imagePreview}
                  alt={msg.fileName}
                  className="max-w-[200px] rounded-xl border border-gray-700 mb-1"
                />
              )}

              {/* File badge */}
              {msg.fileName && !msg.imagePreview && (
                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 mb-1">
                  <span className="text-lg">📎</span>
                  <span className="text-xs text-gray-300 truncate max-w-[200px]">
                    {msg.fileName}
                  </span>
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#00d4aa] text-black rounded-tr-sm"
                    : "bg-[#1a1a1a] border border-gray-800 text-gray-100 rounded-tl-sm"
                }`}
              >
                {formatContent(msg.content)}
              </div>

              {/* Copy button */}
              <button
                onClick={() => copyText(msg.content)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors self-end"
              >
                Copy
              </button>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                AI
              </div>
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-[#00d4aa] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-[#00d4aa] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-[#00d4aa] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached file preview */}
      {attachedFile && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#00d4aa]/30 rounded-xl px-3 py-2">
            {attachedFile.preview ? (
              <img
                src={attachedFile.preview}
                alt=""
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <span className="text-2xl">
                {attachedFile.type.includes("pdf") ? "📄" : "📎"}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">
                {attachedFile.name}
              </p>
              <p className="text-xs text-gray-500">Ready to send</p>
            </div>
            <button
              onClick={removeFile}
              className="text-gray-500 hover:text-red-400 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 pb-4">
        <div className="flex items-end gap-2 bg-[#1a1a1a] border border-gray-700 rounded-2xl px-3 py-2 focus-within:border-[#00d4aa]/50 transition-colors">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.csv,.md,.jpg,.jpeg,.png,.webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-[#00d4aa] transition-colors p-1 flex-shrink-0 mb-1"
            title="Attach file"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 resize-none outline-none min-h-[40px] max-h-[120px] py-1"
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={isLoading || (!input.trim() && !attachedFile)}
            className="bg-[#00d4aa] hover:bg-[#00b894] disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold rounded-xl px-4 py-2 text-sm transition-all flex-shrink-0 mb-0.5"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-2">
          Supports PDF • Images • Text files • CSV
        </p>
      </div>
    </div>
  );
}
