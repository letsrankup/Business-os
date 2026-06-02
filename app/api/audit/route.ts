import { NextRequest, NextResponse } from "next/server";
import { generateAuditReport } from "@/lib/openrouter";

// Yeh line Vercel ko 60 seconds ka time degi
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });
    try { new URL(url); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }
    
    const report = await generateAuditReport(url);
    return NextResponse.json(report);
  } catch (e: any) {
    console.error("Audit Error:", e);
    return NextResponse.json({ error: e.message || "Audit failed" }, { status: 500 });
  }
}
