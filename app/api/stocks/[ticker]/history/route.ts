import { NextRequest, NextResponse } from 'next/server'
import { fetchAggregates } from '@/lib/polygon'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  const { searchParams } = new URL(request.url)
  const days = parseInt(searchParams.get('days') ?? '90', 10)

  try {
    const history = await fetchAggregates(ticker.toUpperCase(), days)

    // Fallback: generate synthetic history if Polygon isn't configured
    if (!history.length) {
      const synthetic = generateSyntheticHistory(ticker.toUpperCase(), days)
      return NextResponse.json({ data: synthetic, synthetic: true })
    }

    return NextResponse.json({ data: history })
  } catch (error) {
    const synthetic = generateSyntheticHistory(ticker.toUpperCase(), days)
    return NextResponse.json({ data: synthetic, synthetic: true })
  }
}

function generateSyntheticHistory(ticker: string, days: number) {
  const BASE_PRICES: Record<string, number> = {
    AAPL: 213, MSFT: 425, NVDA: 138, GOOGL: 171, META: 589, AMZN: 225,
    TSLA: 274, AVGO: 188, AMD: 104, NVDA2: 138, V: 344, MA: 538, JPM: 234,
    LLY: 832, UNH: 580, COST: 968, XOM: 115,
  }
  const base = BASE_PRICES[ticker] ?? 100
  const results = []
  let price = base * (0.82 + Math.random() * 0.18)

  for (let i = days; i >= 0; i--) {
    const drift = (Math.random() - 0.475) * 0.028
    price = Math.max(1, price * (1 + drift))
    const open = price
    const close = price * (1 + (Math.random() - 0.5) * 0.015)
    const high = Math.max(open, close) * (1 + Math.random() * 0.01)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01)

    const d = new Date()
    d.setDate(d.getDate() - i)
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue

    results.push({
      date: d.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 60e6 + 2e6),
    })
  }
  return results
}
