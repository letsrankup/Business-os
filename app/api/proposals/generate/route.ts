import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Client Initialize karo (Apne env variables ke mutabiq)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { leadName, leadEmail, companyName, description, industry, userId } = await req.json();

    // 1. OpenRouter AI se personalized email generate karwana
    const systemPrompt = `You are an expert cold outreach specialist. Write a short, highly personalized cold email to ${leadName}, who works at ${companyName} (${description}) in the ${industry} industry. 
    Offer high-converting web development and automation solutions that solve their specific business needs. 
    Keep it under 150 words. Do not use generic fluff. 
    Return the output strictly in JSON format with two keys: "subject" and "body".`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct:free", // Tum apna preferred model lagana
        messages: [{ role: "user", content: systemPrompt }],
        response_format: { type: "json_object" }
      }),
    });

    const aiData = await response.json();
    
    // AI ka response parse karna
    const generatedContent = JSON.parse(aiData.choices[0].message.content);

    // 2. Newly generated data ko Supabase ki proposals table mein insert karna
    const { data: proposal, error: dbError } = await supabase
      .from('proposals')
      .insert([
        {
          user_id: userId,
          lead_name: leadName,
          lead_email: leadEmail,
          company_name: companyName,
          subject: generatedContent.subject,
          email_body: generatedContent.body,
          status: 'draft'
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // Frontend ko data return karna taaki Modal mein show ho sake
    return NextResponse.json({ success: true, proposal });

  } catch (error: any) {
    console.error("Error in generating proposal:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
