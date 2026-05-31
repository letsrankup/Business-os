import { NextRequest, NextResponse } from "next/server";
import { generateProposal } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clientName || !body.projectDescription)
      return NextResponse.json({ error: "clientName and projectDescription required" }, { status: 400 });
    const proposal = await generateProposal(body);
    return NextResponse.json({ proposal });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Proposal generation failed" }, { status: 500 });
  }
}
