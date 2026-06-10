// app/api/invoice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

// Helper: generate invoice number
function generateInvoiceNumber(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}

// GET - Fetch invoices
export async function GET(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`invoice-get:${clientId}`, { max: 30 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    let query = supabase
      .from("invoices")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;
    if (error) throw error;

    // Summary stats
    const allInvoices = data || [];
    const stats = {
      total: count || 0,
      totalRevenue: allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total_amount), 0),
      pending: allInvoices.filter(i => i.status === "sent").reduce((s, i) => s + Number(i.total_amount), 0),
      overdue: allInvoices.filter(i => i.status === "overdue").reduce((s, i) => s + Number(i.total_amount), 0),
    };

    return NextResponse.json({ success: true, data, total: count, stats });
  } catch (error) {
    console.error("Invoice GET error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST - Create invoice or AI generate from proposal
export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`invoice-post:${clientId}`, { max: 10 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // Get user settings for invoice prefix/counter
    const { data: settings } = await supabase
      .from("user_settings")
      .select("invoice_prefix, invoice_counter, default_currency, default_tax_rate")
      .eq("user_id", user.id)
      .single();

    const prefix = settings?.invoice_prefix || "INV";
    const counter = settings?.invoice_counter || 1;
    const invoiceNumber = generateInvoiceNumber(prefix, counter);

    // AI Generate from description
    if (action === "generate") {
      const { clientName, description, currency = settings?.default_currency || "USD" } = body;

      if (!clientName || !description) {
        return NextResponse.json({ error: "clientName and description are required" }, { status: 400 });
      }

      const aiResult = await callOpenRouter(
        [
          {
            role: "user",
            content: `Generate professional invoice line items for:
Client: ${clientName}
Work Description: ${description}
Currency: ${currency}

Return ONLY valid JSON:
{
  "line_items": [
    {
      "description": "<service description>",
      "quantity": <number>,
      "unit_price": <number>,
      "total": <number>
    }
  ],
  "subtotal": <number>,
  "suggested_due_days": <number>,
  "notes": "<professional invoice note>"
}`,
          },
        ],
        { temperature: 0.3, max_tokens: 800 }
      );

      let invoiceData: Record<string, unknown> = {};
      try {
        invoiceData = JSON.parse(aiResult.content.replace(/```json|```/g, "").trim());
      } catch {
        return NextResponse.json({ error: "AI failed to generate invoice items" }, { status: 500 });
      }

      const subtotal = Number(invoiceData.subtotal) || 0;
      const taxRate = Number(settings?.default_tax_rate) || 0;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (Number(invoiceData.suggested_due_days) || 30));

      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          invoice_number: invoiceNumber,
          client_name: clientName,
          status: "draft",
          line_items: invoiceData.line_items,
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency,
          due_date: dueDate.toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;

      // Increment invoice counter
      await supabase
        .from("user_settings")
        .upsert({ user_id: user.id, invoice_counter: counter + 1 });

      return NextResponse.json({ success: true, data: invoice, model: aiResult.model }, { status: 201 });
    }

    // Manual create
    const {
      client_name,
      line_items = [],
      tax_rate = settings?.default_tax_rate || 0,
      currency = settings?.default_currency || "USD",
      due_date,
      ...rest
    } = body;

    if (!client_name) {
      return NextResponse.json({ error: "client_name is required" }, { status: 400 });
    }

    const subtotal = (line_items as any[]).reduce(
      (sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price) || 0),
      0
    );
    const taxAmount = (subtotal * Number(tax_rate)) / 100;
    const totalAmount = subtotal + taxAmount;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        ...rest,
        user_id: user.id,
        invoice_number: invoiceNumber,
        client_name,
        line_items,
        subtotal,
        tax_rate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency,
        due_date,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;

    // Increment counter
    await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, invoice_counter: counter + 1 });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Invoice POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 500 }
    );
  }
}

// PATCH - Update invoice status or details
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

    // If marking as paid, set paid_at
    if (updates.status === "paid" && !updates.paid_at) {
      updates.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Invoice PATCH error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    console.error("Invoice DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
      }
