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

CRITICAL: Return ONLY a raw JSON array. No markdown. No backticks. No explanation. Start directly with [ and end with ].

Example format:
[
  {
    "id": "lead_1",
    "name": "John Smith",
    "role": "CEO",
    "company": "TechFlow Inc",
    "industry": "${industry || "Technology"}",
    "description": "Fast-growing company actively seeking automation solutions. Recently raised Series A funding.",
    "email": "john@techflow.com",
    "website": "https://techflow.com",
    "score": 92,
    "tags": ["${industry || "Tech"}", "Decision Maker", "High Budget"],
    "phone": "+1-555-123-4567",
    "location": "San Francisco, USA",
    "companySize": "51-200",
    "revenue": "$5M - $10M",
    "linkedIn": "https://linkedin.com/in/johnsmith",
    "painPoints": ["Manual processes slowing growth", "Needs better lead management"],
    "buyingSignals": ["Recently funded", "Actively hiring sales team"]
  }
]

Generate exactly ${count} diverse, realistic leads relevant to "${query}" in the ${industry} industry. Vary scores between 62-97. Use different locations, company sizes, and roles.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[leads] Gemini API error:", errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract text from Gemini response
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      console.error("[leads] Empty Gemini response:", JSON.stringify(data));
      throw new Error("Empty response from Gemini AI");
    }

    // Clean & extract JSON array
    const cleaned = rawText.replace(/```json|```/gi, "").trim();
    const startIdx = cleaned.indexOf("[");
    const endIdx = cleaned.lastIndexOf("]");

    if (startIdx === -1 || endIdx === -1) {
      console.error("[leads] Could not find JSON array in:", rawText.slice(0, 300));
      throw new Error("AI did not return valid JSON array");
    }

    const jsonStr = cleaned.slice(startIdx, endIdx + 1);
    const leads = JSON.parse(jsonStr);

    if (!Array.isArray(leads) || leads.length === 0) {
      throw new Error("No leads returned from AI");
    }

    // Sanitize each lead
    const sanitized = leads.map((lead: any, i: number) => ({
      id: lead.id || `lead_${i + 1}`,
      name: lead.name || "Unknown Contact",
      role: lead.role || "Decision Maker",
      company: lead.company || "Unknown Company",
      industry: lead.industry || industry || "Technology",
      description: lead.description || "Potential lead for your business.",
      email: lead.email || `contact${i + 1}@company.com`,
      website: lead.website || `https://company${i + 1}.com`,
      score: typeof lead.score === "number" ? Math.min(100, Math.max(0, lead.score)) : 75,
      tags: Array.isArray(lead.tags) ? lead.tags.slice(0, 4) : [industry || "Tech"],
      phone: lead.phone || "",
      location: lead.location || "",
      companySize: lead.companySize || "",
      revenue: lead.revenue || "",
      linkedIn: lead.linkedIn || "",
      painPoints: Array.isArray(lead.painPoints) ? lead.painPoints.slice(0, 3) : [],
      buyingSignals: Array.isArray(lead.buyingSignals) ? lead.buyingSignals.slice(0, 3) : [],
    }));

    return NextResponse.json(sanitized);

  } catch (err: any) {
    console.error("[/api/leads] Final error:", err?.message);
    return NextResponse.json(
      { error: err.message || "Lead discovery failed. Please try again." },
      { status: 500 }
    );
  }
        }
