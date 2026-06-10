// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter, streamOpenRouter, FREE_MODELS } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`chat:${clientId}`, { max: 20, windowMs: 60_000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const body = await req.json();
    const {
      messages,
      sessionId,
      stream = false,
      model,
      systemPrompt,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    // Validate messages format
    const validMessages = messages.filter(
      (m: any) =>
        m &&
        typeof m.role === "string" &&
        ["user", "assistant", "system"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    );

    if (validMessages.length === 0) {
      return NextResponse.json({ error: "No valid messages provided" }, { status: 400 });
    }

    const defaultSystem = `You are Business OS AI Assistant — a powerful, knowledgeable business advisor.
You help with: SEO strategy, lead generation, proposal writing, business analytics, CRM, invoicing, and content creation.
Be concise, actionable, and professional. Use bullet points and structure when helpful.
Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;

    const finalSystem = systemPrompt || defaultSystem;

    // Streaming response
    if (stream) {
      const streamResponse = await streamOpenRouter(validMessages, {
        model: model || FREE_MODELS[0],
        system: finalSystem,
        temperature: 0.7,
        max_tokens: 1500,
      });

      if (!streamResponse.ok) {
        const err = await streamResponse.json().catch(() => ({}));
        return NextResponse.json(
          { error: err?.error?.message || "Streaming failed" },
          { status: streamResponse.status }
        );
      }

      // Pass through the stream
      return new Response(streamResponse.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          ...getRateLimitHeaders(rateLimit),
        },
      });
    }

    // Non-streaming response
    const aiResult = await callOpenRouter(validMessages, {
      model,
      system: finalSystem,
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Save session to Supabase if sessionId provided
    if (sessionId) {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const assistantMessage = { role: "assistant", content: aiResult.content };
            const allMessages = [...validMessages, assistantMessage];

            // Upsert chat session
            await supabase.from("chat_sessions").upsert({
              id: sessionId,
              user_id: user.id,
              messages: allMessages,
              model_used: aiResult.model,
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (dbErr) {
        console.error("Failed to save chat session:", dbErr);
        // Don't fail request over DB error
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: aiResult.content,
        model: aiResult.model,
        usage: aiResult.usage,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed. Please try again." },
      { status: 500 }
    );
  }
}

// GET - Fetch chat sessions
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .eq("user_id", user.id)
        .single();

      if (error) return NextResponse.json({ error: "Session not found" }, { status: 404 });
      return NextResponse.json({ success: true, data });
    }

    // List all sessions
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("id, title, model_used, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Chat GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
      }
