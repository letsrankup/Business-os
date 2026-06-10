// File: app/api/proposals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkAndIncrementUsage } from "@/lib/rateLimit";

// GET: List proposals
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");
    const offset = (page - 1) * limit;

    const { data, count, error: dbError } = await supabase
      .from("proposals")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (dbError) throw dbError;
    return NextResponse.json({ proposals: data, total: count, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Generate proposal with AI
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit check
    const limit = await checkAndIncrementUsage(supabase, user.id, "proposal");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.reason, remaining: limit.remaining },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      yourName, yourCompany, clientName, clientBusiness,
      budget, projectType, timeline, projectDescription,
    } = body;

    if (!clientName || !projectDescription) {
      return NextResponse.json({ error: "Client name and project description required" }, { status: 400 });
    }

    const prompt = `You are a professional business proposal writer. Generate a detailed, compelling client proposal.

Freelancer/Agency: ${yourName ?? "Our Agency"} ${yourCompany ? `(${yourCompany})` : ""}
Client: ${clientName} ${clientBusiness ? `— ${clientBusiness}` : ""}
Project Type: ${projectType ?? "Web Development"}
Budget: ${budget ?? "To be discussed"}
Timeline: ${timeline ?? "4 weeks"}
Project Description: ${projectDescription}

Write a full professional proposal with:
1. Executive Summary
2. Project Scope & Deliverables
3. Timeline & Milestones
4. Investment (pricing breakdown)
5. Why Us
6. Next Steps

Be specific, professional, and persuasive. Use the actual details provided.`;

    const proposalText = await callOpenRouter(
      [{ role: "user", content: prompt }],
      { model: "smart", maxTokens: 2000 }
    );

    const { data: saved, error: saveError } = await supabase
      .from("proposals")
      .insert({
        user_id: user.id,
        client_name: clientName,
        client_business: clientBusiness ?? null,
        your_name: yourName ?? null,
        your_company: yourCompany ?? null,
        budget: budget ?? null,
        project_type: projectType ?? "Web Development",
        timeline: timeline ?? "4 weeks",
        project_description: projectDescription,
        content: proposalText,
        status: "draft",
      })
      .select()
      .single();

    if (saveError) throw saveError;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      type: "proposal_generated",
      description: `Proposal created for ${clientName}`,
      metadata: { proposal_id: saved.id },
    });

    return NextResponse.json(
      { proposal: saved, remaining: limit.remaining },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update proposal status
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, status, content } = body;
    if (!id) return NextResponse.json({ error: "Proposal ID required" }, { status: 400 });

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (content) updates.content = content;

    const { data, error: updateError } = await supabase
      .from("proposals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ proposal: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove proposal
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Proposal ID required" }, { status: 400 });

    const { error: deleteError } = await supabase
      .from("proposals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;
    return NextResponse.json({ message: "Proposal deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
      }
