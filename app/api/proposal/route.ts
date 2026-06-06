// app/api/proposal/route.ts

import { NextRequest, NextResponse } from "next/server";
import { generateProposal, generateLeadProposal } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 30;

// Full proposal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    // Lead outreach proposal
    if (type === "lead") {
      const { name, company, title, industry, description, email, website } = body;
      if (!name || !company) {
        return NextResponse.json({ error: "name and company are required" }, { status: 400 });
      }
      const proposal = await generateLeadProposal({ name, company, title, industry, description, email, website });
      return NextResponse.json({ success: true, data: proposal });
    }

    // Full project proposal
    const { clientName, projectType, projectDescription } = body;
    if (!clientName || !projectType || !projectDescription) {
      return NextResponse.json(
        { error: "clientName, projectType, and projectDescription are required" },
        { status: 400 }
      );
    }

    const proposal = await generateProposal(body);
    return NextResponse.json({ success: true, data: proposal });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Proposal generation failed";
    console.error("[/api/proposal]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
                                                                  }
