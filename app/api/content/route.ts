import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.contentType || !body.topic)
      return NextResponse.json({ error: "contentType and topic required" }, { status: 400 });
    const content = await generateContent(body);
    return NextResponse.json({ content });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Content generation failed" }, { status: 500 });
  }
}
