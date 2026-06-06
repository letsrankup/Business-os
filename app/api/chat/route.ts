import { NextRequest, NextResponse } from "next/server";

// ✅ Same as SEO Audit — Vercel ko 60 sec time deta hai
export const maxDuration = 60;

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export async function POST(req: NextRequest) {
  try {
    const { messages, fileContent, fileName } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages required" },
        { status: 400 }
      );
    }

    // ✅ File content ko last message mein add karo
    const apiMessages = messages.map((m: any, i: number) => {
      if (i === messages.length - 1 && fileContent && fileName) {
        return {
          role: m.role,
          content: `${m.content}\n\n📎 File: ${fileName}\n\nContent:\n${fileContent}`,
        };
      }
      return { role: m.role, content: m.content };
    });

    // ✅ Same OpenRouter API key — audit jesa
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
              "You are a powerful AI Business Assistant for Business OS. Help with: business strategy, proposals, content writing, SEO analysis, file analysis, and any business questions. Be professional, helpful, and concise.",
          },
          ...apiMessages,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "I could not generate a response. Please try again.";

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("Chat Error:", e);
    return NextResponse.json(
      { error: e.message || "Chat failed" },
      { status: 500 }
    );
  }
          }
