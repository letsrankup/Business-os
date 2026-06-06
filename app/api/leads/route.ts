// app/api/leads/route.ts
// Real AI-powered lead discovery — no hardcoded fake leads

import { NextRequest, NextResponse } from "next/server";
import { discoverLeads } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const query: string = body?.query?.trim() ?? "";
    const industry: string = body?.industry?.trim() ?? "Technology";
    const count: number = Math.min(Math.max(parseInt(body?.count ?? "6"), 1), 15);

    if (!query) {
      return NextResponse.json(
        { error: "Target description (query) is required" },
        { status: 400 }
      );
    }

    const leads = await discoverLeads({ query, industry, count });

    return NextResponse.json({ success: true, data: leads, count: leads.length });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Lead discovery failed";
    console.error("[/api/leads]", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "Leads API is running" });
      }
