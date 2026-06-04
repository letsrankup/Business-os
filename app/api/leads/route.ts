// ============================================================
//  app/api/leads/route.ts
//  Yeh file EXACTLY yahan rakho: app/api/leads/route.ts
// ============================================================

import { discoverLeads } from "@/lib/openrouter";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { query, industry } = await req.json();

    if (!query?.trim() || !industry?.trim()) {
      return NextResponse.json(
        { error: "query aur industry required hain" },
        { status: 400 }
      );
    }

    const leads = await discoverLeads({ query, industry });
    return NextResponse.json(leads);
  } catch (err: any) {
    console.error("[/api/leads]", err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
