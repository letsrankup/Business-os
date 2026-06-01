import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Server config missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, email, password } = await req.json();

    if (action === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ user: data.user, message: "Check your email" });
    }
    if (action === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ user: data.user, session: data.session });
    }
    if (action === "logout") {
      await supabase.auth.signOut();
      return NextResponse.json({ message: "Logged out" });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Auth failed" }, { status: 500 });
  }
        }
