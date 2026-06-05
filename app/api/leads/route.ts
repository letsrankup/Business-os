// FILE: app/api/leads/route.ts
// Yeh pura code app/api/leads/route.ts mein paste karo

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, industry, count = 6 } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Target description is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a B2B lead generation expert. Generate ${count} highly realistic sales leads.

Target: "${query}"
Industry: "${industry || "Technology"}"

IMPORTANT: Return ONLY a raw JSON array. No markdown. No backticks. No explanation. Just pure JSON.

[
  {
    "id": "lead_1",
    "name": "Full Name",
    "role": "Job Title",
    "company": "Company Name",
    "industry": "${industry || "Technology"}",
    "description": "Why this person is a great lead in 2 sentences.",
    "email": "name@company.com",
    "website": "https://company.com",
    "score": 85,
    "tags": ["${industry || "Tech"}", "Decision Maker"],
    "phone": "+1-555-123-4567",
    "location": "New York, USA",
    "companySize": "51-200",
    "revenue": "$2M - $10M",
    "linkedIn": "https://linkedin.com/in/name",
    "painPoints": ["needs more leads", "slow growth"],
    "buyingSignals": ["recently funded", "hiring sales team"]
  }
]

Generate exactly ${count} leads. Make names, companies, emails realistic. Vary scores 62-97. All relevant to: "${query}" in ${industry} industry.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000",
        "X-Title": "Business OS - Lead Discovery",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          {
            role: "system",
            content: "You are a B2B lead generation expert. Always respond with pure JSON only. No markdown, no backticks, no explanation.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[leads] OpenRouter error:", errText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";

    if (!rawText) {
      throw new Error("Empty response from AI");
    }

    // Clean & extract JSON array
    const cleaned = rawText.replace(/```json|```/gi, "").trim();
    const startIdx = cleaned.indexOf("[");
    const endIdx = cleaned.lastIndexOf("]");

    if (startIdx === -1 || endIdx === -1) {
      console.error("[leads] Raw text was:", rawText.slice(0, 300));
      throw new Error("AI did not return valid JSON array");
    }

    const jsonStr = cleaned.slice(startIdx, endIdx + 1);
    const leads = JSON.parse(jsonStr);

    if (!Array.isArray(leads) || leads.length === 0) {
      throw new Error("No leads returned from AI");
    }

    // Make sure every lead has required fields
    const cleaned_leads = leads.map((lead: any, i: number) => ({
      id: lead.id || `lead_${i + 1}`,
      name: lead.name || "Unknown",
      role: lead.role || "Decision Maker",
      company: lead.company || "Unknown Company",
      industry: lead.industry || industry || "Technology",
      description: lead.description || "Potential lead.",
      email: lead.email || `contact@company${i}.com`,
      website: lead.website || `https://company${i}.com`,
      score: typeof lead.score === "number" ? lead.score : 75,
      tags: Array.isArray(lead.tags) ? lead.tags : [industry || "Tech"],
      phone: lead.phone || "",
      location: lead.location || "",
      companySize: lead.companySize || "",
      revenue: lead.revenue || "",
      linkedIn: lead.linkedIn || "",
      painPoints: Array.isArray(lead.painPoints) ? lead.painPoints : [],
      buyingSignals: Array.isArray(lead.buyingSignals) ? lead.buyingSignals : [],
    }));

    return NextResponse.json(cleaned_leads);

  } catch (err: any) {
    console.error("[/api/leads] Error:", err?.message);
    return NextResponse.json(
      { error: err.message || "Lead discovery failed" },
      { status: 500 }
    );
  }
}
