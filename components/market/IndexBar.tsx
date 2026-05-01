'use client'

import { useMemo } from 'react'
import type { StockQuote } from '@/types'

const INDICES = [
  { label: 'S&P 500', tickers: ['AAPL','MSFT','NVDA','GOOGL','META'], base: 5842 },
  { label: 'NASDAQ',  tickers: ['NVDA','META','AMZN','TSLA','AAPL'], base: 18234 },
  { label: 'DOW',     tickers: ['JPM','GS','CAT','HON','V'], base: 43120 },
  { label: 'Gainers', type: 'count' as const },
  { label: 'Losers',  type: 'count' as const },
]

export default function IndexBar({ quotes }: { quotes: StockQuote[] }) {
  const gainers = quotes.filter(q => q.changePercent > 0).length
  const losers = quotes.filter(q => q.changePercent < 0).length

  const approximateIndex = (tickers: string[], base: number) => {
    const relevant = quotes.filter(q => tickers.includes(q.ticker))
    if (!relevant.length) return { val: base, chg: 0 }
    const avgChg = relevant.reduce((a, b) => a + b.changePercent, 0) / relevant.length
    const val = base * (1 + avgChg / 100)
    return { val: +val.toFixed(2), chg: +avgChg.toFixed(2) }
  }

  const spx = approximateIndex(['AAPL','MSFT','NVDA','GOOGL','META'], 5842)
  const ndx = approximateIndex(['NVDA','META','AMZN','TSLA','AMD'], 18234)
  const dow = approximateIndex(['JPM','GS','CAT','HON','V'], 43120)

  const cell = (label: string, val: string, chg: number) => (
    <div key={label} style={{ background: 'var(--s1)', padding: '.65rem 1.1rem' }}>
      <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--gold)' }}>{val}</div>
      <div style={{ fontSize: '10px', marginTop: 1, color: chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
        {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 1, background: 'var(--border)', borderBottom: '1px solid var(--border)' }}>
      {cell('S&P 500', spx.val.toLocaleString('en-US', { minimumFractionDigits: 2 }), spx.chg)}
      {cell('NASDAQ', ndx.val.toLocaleString('en-US', { minimumFractionDigits: 2 }), ndx.chg)}
      {cell('DOW', dow.val.toLocaleString('en-US', { minimumFractionDigits: 2 }), dow.chg)}
      <div style={{ background: 'var(--s1)', padding: '.65rem 1.1rem' }}>
        <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Gainers</div>
        <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--green)' }}>{gainers}</div>
      </div>
      <div style={{ background: 'var(--s1)', padding: '.65rem 1.1rem' }}>
        <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>Losers</div>
        <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--red)' }}>{losers}</div>
      </div>
    </div>
  )
}
