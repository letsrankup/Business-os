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
      count: count || 6,        // ✅ count add kiya — yahi error tha
    });

    return NextResponse.json({ success: true, leads });

  } catch (err: any) {
    console.error("[/api/leads]", err?.message);
    return NextResponse.json(
      { success: false, error: err.message || "Lead discovery failed" },
      { status: 500 }
    );
  }
}
