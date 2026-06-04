import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseAvailable } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead } = body

    if (!lead) {
      return NextResponse.json(
        { success: false, error: 'Lead data missing' },
        { status: 400 }
      )
    }

    // AI se proposal generate karo
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Write a professional business proposal for:
Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title || 'Decision Maker'}
Industry: ${lead.industry || 'Technology'}

Keep it concise, persuasive, and professional. Max 3 paragraphs.`,
          },
        ],
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('AI Error:', errText)
      return NextResponse.json(
        { success: false, error: 'AI proposal generation failed' },
        { status: 500 }
      )
    }

    const aiData = await aiResponse.json()
    const proposal = aiData.content?.[0]?.text || ''

    // Agar Supabase available hai to save karo, warna skip karo
    if (isSupabaseAvailable && supabase) {
      await supabase.from('proposals').insert({
        lead_name: lead.name,
        lead_company: lead.company,
        proposal_text: proposal,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, proposal })
  } catch (error: any) {
    console.error('Proposal route error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
      }
