import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, fileContent, fileName } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages required" },
        { status: 400 }
      );
    }

    const apiMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // File attached hai to last message mein add karo
    if (fileContent && fileName) {
      const last = apiMessages[apiMessages.length - 1];
      apiMessages[apiMessages.length - 1] = {
        ...last,
        content: `${last.content}\n\n📎 Attached File: ${fileName}\n\nFile Content:\n${fileContent}`,
      };
    }

    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Business OS",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          {
            role: "system",
            content:
              "You are a powerful AI Business Assistant. Help with business analysis, proposals, content, SEO, strategy, and file analysis. Be professional, clear, and concise.",
          },
          ...apiMessages,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${err}`);
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content || "No response generated.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: error.message || "Chat failed" },
      { status: 500 }
    );
  }
}
