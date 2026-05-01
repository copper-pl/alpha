import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { AIRequest } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: AIRequest = await request.json()

  const prompt = buildPrompt(body)
  if (!prompt) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')

    // Optionally persist the insight
    await supabase.from('ai_insights').insert({
      user_id: user.id,
      mode: body.mode,
      prompt,
      response: text,
    })

    return NextResponse.json({ data: text })
  } catch (error: any) {
    console.error('Anthropic error:', error)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}

function buildPrompt(req: AIRequest): string | null {
  const { mode, stocks, portfolio, customPrompt } = req

  if (customPrompt) {
    return `You are a professional financial market analyst. Answer this question concisely and directly in under 120 words:\n\n${customPrompt}`
  }

  const stockSummary = (stocks ?? [])
    .slice(0, 10)
    .map(s => `${s.ticker} (${s.name}): ${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}% | $${s.price.toFixed(2)} | P/E: ${s.pe ?? 'N/A'} | ${s.sector}`)
    .join('\n')

  switch (mode) {
    case 'market':
      return `You are a sharp financial analyst. Today's top market movers:\n${stockSummary}\n\nProvide a concise market overview: key themes, sector leadership, and 1 actionable takeaway. 5 sentences max. Be direct and specific, no disclaimers.`

    case 'sector':
      return `Sector rotation analyst. Market data:\n${stockSummary}\n\nWhich sectors are leading and lagging today? What does this rotation signal for the next week? What should investors do? 5 sentences. Direct, specific.`

    case 'macro':
      return `Macro strategist. VIX ~18, 10Y yield ~4.28%. Current movers:\n${stockSummary}\n\nWhat do these collectively signal about macro risk? Rate sensitivity? Any regime change signals? 5 sentences max, 100 words.`

    case 'screener':
      return `Stock screener analyst. Universe:\n${stockSummary}\n\nIdentify the 3 best risk/reward setups based on momentum, valuation, and sector strength. Rank them and justify each pick. 6 sentences. Be specific about entry rationale.`

    case 'portfolio_risk':
      if (!portfolio?.length) return null
      const riskData = portfolio.map(p =>
        `${p.ticker} (${p.quote?.sector}): ${p.shares} shares, cost $${p.avg_cost.toFixed(2)}, now $${p.quote?.price.toFixed(2) ?? '?'}, P&L ${p.gainLossPercent.toFixed(1)}%, value $${p.marketValue.toFixed(2)}`
      ).join('\n')
      return `Portfolio risk analyst. Holdings:\n${riskData}\n\nAssess: concentration risk, sector diversification, most vulnerable positions, beta exposure. 5 sentences. Be direct, name specific tickers.`

    case 'portfolio_rebal':
      if (!portfolio?.length) return null
      const rebalData = portfolio.map(p =>
        `${p.ticker}: ${p.shares} sh, $${p.marketValue.toFixed(2)} (${((p.marketValue / portfolio.reduce((a, b) => a + b.marketValue, 0)) * 100).toFixed(1)}%), P&L ${p.gainLossPercent.toFixed(1)}%`
      ).join('\n')
      return `Portfolio rebalancing advisor. Holdings:\n${rebalData}\n\nWhat should be trimmed, added, or swapped? Are any positions oversized? Any clear exits? 5 sentences, specific to these tickers.`

    case 'portfolio_outlook':
      if (!portfolio?.length) return null
      const outlookData = portfolio.map(p =>
        `${p.ticker} (${p.quote?.sector}): $${p.quote?.price.toFixed(2) ?? '?'}, P&L ${p.gainLossPercent.toFixed(1)}%`
      ).join('\n')
      return `Investment strategist. Portfolio:\n${outlookData}\n\nShort-term outlook for these specific holdings over the next 2-4 weeks. Catalysts, risks, and 1 highest-conviction call. 5 sentences.`

    default:
      return null
  }
}
