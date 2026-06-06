import { NextRequest, NextResponse } from "next/server";

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

    // ✅ Sirf last 3 messages — tokens bachao (SEO audit jesa)
    const recentMessages = messages.slice(-3);

    // ✅ File content last message mein add karo
    const apiMessages = recentMessages.map((m: any, i: number) => {
      if (
        i === recentMessages.length - 1 &&
        fileContent &&
        fileName
      ) {
        return {
          role: m.role,
          content: `${m.content}\n\nAttached: ${fileName}\n${fileContent.slice(0, 500)}`,
        };
      }
      return { role: m.role, content: m.content };
    });

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
              "You are an AI Business Assistant. Be helpful and concise.",
          },
          ...apiMessages,
        ],
        max_tokens: 280, // ✅ SEO Audit jitna — kaam karta hai
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
      "Could not generate response. Try again.";

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("Chat Error:", e);
    return NextResponse.json(
      { error: e.message || "Chat failed" },
      { status: 500 }
    );
  }
                  }
