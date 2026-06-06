import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { messages, fileContent, fileName } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages required" },
        { status: 400 }
      );
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // OpenAI format → Gemini format convert karo
    const recentMessages = messages.slice(-6);

    const contents = recentMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // File content last message mein add karo
    if (fileContent && fileName && contents.length > 0) {
      const last = contents[contents.length - 1];
      last.parts[0].text += `\n\nAttached File: ${fileName}\nContent:\n${fileContent.slice(0, 1000)}`;
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: "You are an AI Business Assistant for Business OS. Help with business strategy, proposals, content writing, SEO analysis, and file analysis. Be professional, helpful, and concise.",
              },
            ],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Could not generate response. Please try again.";

    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("Chat Error:", e);
    return NextResponse.json(
      { error: e.message || "Chat failed" },
      { status: 500 }
    );
  }
  }
