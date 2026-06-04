import { NextRequest, NextResponse } from "next/server";
import { generateProposal, generateLeadProposal } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Lead card se aaya proposal (Leads page)
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
        title: lead.title,
        industry: lead.industry,
        description: lead.description,
      });

      return NextResponse.json({ success: true, proposal });
    }

    // Full proposal form se aaya
    if (!body.clientName || !body.projectDescription) {
      return NextResponse.json(
        { error: "clientName and projectDescription are required" },
        { status: 400 }
      );
    }

    const proposal = await generateProposal({
      clientName: body.clientName,
      projectDescription: body.projectDescription,
      budget: body.budget,
      timeline: body.timeline,
      industry: body.industry,
    });

    return NextResponse.json({ success: true, proposal });

  } catch (error: any) {
    console.error("Proposal API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Proposal generation failed" },
      { status: 500 }
    );
  }
}
