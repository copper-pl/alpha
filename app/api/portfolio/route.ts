import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/portfolio
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/portfolio → upsert position
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, shares, avg_cost } = await request.json()
  if (!ticker || !shares || !avg_cost) {
    return NextResponse.json({ error: 'ticker, shares, and avg_cost are required' }, { status: 400 })
  }
  if (shares <= 0 || avg_cost <= 0) {
    return NextResponse.json({ error: 'shares and avg_cost must be positive' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('portfolio')
    .upsert(
      { user_id: user.id, ticker: ticker.toUpperCase(), shares, avg_cost },
      { onConflict: 'user_id,ticker' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/portfolio?ticker=AAPL
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticker = new URL(request.url).searchParams.get('ticker')
  if (!ticker) return NextResponse.json({ error: 'Ticker required' }, { status: 400 })

  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('user_id', user.id)
    .eq('ticker', ticker.toUpperCase())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
