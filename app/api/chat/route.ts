// File: app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { streamOpenRouter, callOpenRouter, OpenRouterMessage } from "@/lib/openrouter";
import { checkAndIncrementUsage } from "@/lib/rateLimit";

const SYSTEM_PROMPTS: Record<string, string> = {
  general: "You are a smart AI business assistant inside Business OS. Help users with business strategy, marketing, SEO, content, and operations. Be concise and actionable.",
  seo: "You are an expert SEO consultant. Analyze, advise, and provide actionable SEO strategies. Use data-driven recommendations.",
  content: "You are a professional content strategist and copywriter. Help create, improve, and optimize content for any channel.",
  sales: "You are an expert sales coach and business developer. Help with pitches, proposals, objection handling, and closing deals.",
  analytics: "You are a business analytics expert. Help interpret data, identify trends, and provide actionable insights.",
};

// GET: Fetch chat history
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (sessionId) query = query.eq("session_id", sessionId);

    const { data, error: dbError } = await query;
    if (dbError) throw dbError;

    return NextResponse.json({ messages: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Send message (streaming)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit check
    const rateLimitResult = await checkAndIncrementUsage(supabase, user.id, "ai_chat");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason, remaining: rateLimitResult.remaining },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, mode = "general", sessionId, history = [] } = body;

    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.general;

    // Build conversation history
    const messages: OpenRouterMessage[] = [
      ...history.slice(-10), // Last 10 messages for context
      { role: "user", content: message },
    ];

    // Save user message to DB
    const { data: userMsg } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        session_id: sessionId ?? crypto.randomUUID(),
        role: "user",
        content: message,
        mode,
      })
      .select()
      .single();

    // Stream response
    const stream = await streamOpenRouter(messages, {
      model: "chat",
      systemPrompt,
      maxTokens: 2000,
    });

    // Return streaming response — client reads SSE chunks
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Session-Id": userMsg?.session_id ?? "",
        "X-Remaining-Daily": String(rateLimitResult.remaining?.daily ?? ""),
        "X-Remaining-Monthly": String(rateLimitResult.remaining?.monthly ?? ""),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Clear chat session
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    let query = supabase.from("chat_messages").delete().eq("user_id", user.id);
    if (sessionId) query = query.eq("session_id", sessionId);

    const { error: deleteError } = await query;
    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Chat cleared" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
