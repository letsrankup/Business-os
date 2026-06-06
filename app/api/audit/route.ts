// app/api/audit/route.ts
// Real SEO audit — fetches actual URL data, no fake numbers

import { NextRequest, NextResponse } from "next/server";
import { generateAuditReport } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 30; // Vercel max for hobby plan

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl: string = body?.url ?? "";

    if (!rawUrl) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const url = normalizeUrl(rawUrl);

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL. Please enter a valid website URL." },
        { status: 400 }
      );
    }

    const report = await generateAuditReport(url);

    return NextResponse.json({ success: true, data: report });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit failed";
    console.error("[/api/audit]", message);

    // Return specific error — no fake fallback data
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "SEO Audit API is running" });
      }
