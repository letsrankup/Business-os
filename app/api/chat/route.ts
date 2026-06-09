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

    // Ab Yeh Direct OPENROUTER_API_KEY use karega
    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
    if (!OPENROUTER_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // OpenAI standard formats ko direct pass kiya ja sakta hai OpenRouter par
    const recentMessages = messages.slice(-6);

    // File content ko last message mein inject karne ka aapka logic
    if (fileContent && fileName && recentMessages.length > 0) {
      const last = recentMessages[recentMessages.length - 1];
      last.content += `\n\nAttached File: ${fileName}\nContent:\n${fileContent.slice(0, 1000)}`;
    }

    // System instruction ko array ke shuru mein add karna OpenRouter standard hai
    const systemInstruction = {
      role: "system",
      content: "You are an AI Business Assistant for Business OS. Help with business strategy, proposals, content writing, SEO analysis, and file analysis. Be professional, helpful, and concise."
    };

    const finalMessages = [systemInstruction, ...recentMessages];

    // OpenRouter Unified API endpoint aur payload configuration
    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": "https://letsrankup.ai",
          "X-Title": "LetsRankUp Business OS"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash", // OpenRouter Model Standard Name
          messages: finalMessages,
          max_tokens: 800,
          temperature: 0.7,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }

    const data = await res.json();
    
    // OpenRouter / OpenAI format ke mutabiq reply extract karna
    const reply =
      data?.choices?.[0]?.message?.content ||
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
        
