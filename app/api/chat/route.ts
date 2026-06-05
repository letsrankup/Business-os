// ============================================================
//  app/api/chat/route.ts
//  AI Chat API Route
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an expert AI Business Assistant for "Business OS" — an AI-powered business platform.

You specialize in:
- B2B Sales & Lead Generation strategies
- Cold email & outreach writing
- SEO and digital marketing advice
- Business proposals and pitches
- Content marketing
- CRM and client management
- Freelancing and agency growth tips

Tone: Professional yet friendly. Be concise and actionable. Use bullet points when listing steps. 
Language: Respond in the same language the user writes in (Urdu/English/mixed).
Format: Use markdown-style formatting where helpful (bold for key points, bullet lists for steps).`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AI Business OS",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-12), // last 12 messages for context
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `AI Error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Koi response nahi mila.";

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("[/api/chat]", err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
        }
