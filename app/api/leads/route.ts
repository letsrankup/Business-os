import { NextRequest, NextResponse } from "next/server";
import { discoverLeads } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, industry, count } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Target description is required" },
        { status: 400 }
      );
    }

    const leads = await discoverLeads({
      query,
      industry: industry || "Technology",
      count: count || 6,
    });

    // ✅ Direct array return karo — wrapper nahi
    return NextResponse.json(leads);

  } catch (err: any) {
    console.error("[/api/leads]", err?.message);
    return NextResponse.json(
      { error: err.message || "Lead discovery failed" },
      { status: 500 }
    );
  }
}
