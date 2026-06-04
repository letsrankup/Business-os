import { NextRequest, NextResponse } from "next/server";
import { generateProposal, generateLeadProposal } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Lead Card Propose Button ──────────────────────────────
    if (body.lead) {
      const { lead } = body;

      if (!lead.name || !lead.company) {
        return NextResponse.json(
          { error: "Lead name and company are required" },
          { status: 400 }
        );
      }

      const proposal = await generateLeadProposal({
        name: lead.name,
        company: lead.company,
        title: lead.title || lead.role || "Decision Maker",
        industry: lead.industry,
        description: lead.description,
        email: lead.email,
        website: lead.website,
      });

      return NextResponse.json({ success: true, proposal });
    }

    // ── Full Proposal Form ────────────────────────────────────
    if (!body.clientName || !body.projectDescription) {
      return NextResponse.json(
        { error: "clientName and projectDescription are required" },
        { status: 400 }
      );
    }

    const proposal = await generateProposal({
      clientName: body.clientName,
      clientBusiness: body.clientBusiness || "",
      projectType: body.projectType || "General Project",
      projectDescription: body.projectDescription,
      budget: body.budget || "To be discussed",
      timeline: body.timeline || "To be agreed",
      yourName: body.yourName || "Our Team",
      yourCompany: body.yourCompany || "Our Company",
    });

    return NextResponse.json({ success: true, proposal });

  } catch (error: any) {
    console.error("Proposal API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Proposal generation failed",
      },
      { status: 500 }
    );
  }
  }
