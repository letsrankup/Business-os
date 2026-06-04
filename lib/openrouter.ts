const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Free + powerful model
const DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free";

interface ProposalInput {
  clientName: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  industry?: string;
}

export async function generateProposal(input: ProposalInput): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  const prompt = `You are a professional business consultant. Write a compelling and detailed business proposal.

Client Name: ${input.clientName}
Project Description: ${input.projectDescription}
${input.budget ? `Budget: ${input.budget}` : ""}
${input.timeline ? `Timeline: ${input.timeline}` : ""}
${input.industry ? `Industry: ${input.industry}` : ""}

Write a professional proposal with these sections:
1. Executive Summary
2. Project Understanding
3. Our Approach & Solution
4. Deliverables
5. Timeline & Milestones
6. Investment
7. Why Choose Us
8. Next Steps

Make it persuasive, professional, and tailored to the client.`;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000",
      "X-Title": "Business OS",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `OpenRouter API error: ${response.status}`
    );
  }

  const data = await response.json();
  const proposal = data?.choices?.[0]?.message?.content;

  if (!proposal) {
    throw new Error("No proposal generated from AI");
  }

  return proposal;
}

// Lead ke liye short proposal (Leads page ke liye)
export async function generateLeadProposal(lead: {
  name: string;
  company: string;
  title?: string;
  industry?: string;
  description?: string;
}): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  const prompt = `Write a short, personalized outreach proposal (max 200 words) for this prospect:

Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title || "Decision Maker"}
Industry: ${lead.industry || "Technology"}
${lead.description ? `Context: ${lead.description}` : ""}

Make it professional, warm, and focused on their specific needs. Include a clear call to action.`;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000",
      "X-Title": "Business OS",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `OpenRouter API error: ${response.status}`
    );
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "Proposal generation failed";
}
