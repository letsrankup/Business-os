// app/api/proposal/route.ts — FIXED

import { NextRequest, NextResponse } from "next/server";
import { generateProposal, generateLeadProposal } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Lead outreach email ──────────────────────────────────
    if (body.lead) {
      const lead = body.lead as Record<string, string>;

      if (!lead.name || !lead.company) {
        return NextResponse.json(
          { error: "Lead name and company are required" },
          { status: 400 }
        );
      }

      // Pass only fields that exist in LeadProposalParams type
      const proposal = await generateLeadProposal({
        name:        lead.name,
        company:     lead.company,
        title:       lead.title || lead.role || "Decision Maker",
        industry:    lead.industry,
        description: lead.description,
      });

      return NextResponse.json({ success: true, proposal });
    }

    // ── Standard project proposal ────────────────────────────
    if (!body.clientName || !body.projectDescription) {
      return NextResponse.json(
        { error: "clientName and projectDescription are required" },
        { status: 400 }
      );
    }

    const proposal = await generateProposal({
      clientName:         body.clientName,
      clientBusiness:     body.clientBusiness     || "",
      projectType:        body.projectType        || "General Project",
      projectDescription: body.projectDescription,
      budget:             body.budget             || "To be discussed",
      timeline:           body.timeline           || "To be agreed",
      yourName:           body.yourName           || "Our Team",
      yourCompany:        body.yourCompany        || "Our Company",
    });

    return NextResponse.json({ success: true, proposal });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Proposal generation failed";
    console.error("Proposal API Error:", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
