// app/api/content/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { contentType, topic, tone, keywords, targetAudience, wordCount } = body;

    if (!contentType || !topic || !tone) {
      return NextResponse.json(
        { error: "contentType, topic, and tone are required" },
        { status: 400 }
      );
    }

    const validTypes = ["blog", "linkedin", "email", "ad", "product", "social"];
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: `contentType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const content = await generateContent({
      contentType,
      topic,
      tone,
      keywords: Array.isArray(keywords) ? keywords : [],
      targetAudience,
      wordCount,
    });

    return NextResponse.json({ success: true, data: content });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Content generation failed";
    console.error("[/api/content]", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
