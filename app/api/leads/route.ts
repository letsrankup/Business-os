import { NextRequest, NextResponse } from "next/server";
import { discoverLeads } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { query, industry, count } = await req.json();
    if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
    const leads = await discoverLeads({ query, industry: industry || "General", count: count || 6 });
    return NextResponse.json({ leads });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Lead discovery failed" }, { status: 500 });
  }
}
