'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { OHLCV, StockQuote } from '@/types'

interface Props {
  tickers: { ticker: string; name: string }[]
  selectedTicker: string
  onSelectTicker: (ticker: string) => void
  currentQuote?: StockQuote
}

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function ChartPanel({ tickers, selectedTicker, onSelectTicker, currentQuote }: Props) {
  const [history, setHistory] = useState<OHLCV[]>([])
  const [loading, setLoading] = useState(false)
  const [range, setRange] = useState(30)
  const [synthetic, setSynthetic] = useState(false)

  useEffect(() => {
    if (!selectedTicker) return
    setLoading(true)
    fetch(`/api/stocks/${selectedTicker}/history?days=${range}`)
      .then(r => r.json())
      .then(json => {
        setHistory(json.data ?? [])
        setSynthetic(!!json.synthetic)
      })
      .finally(() => setLoading(false))
  }, [selectedTicker, range])

  const isUp = currentQuote ? currentQuote.changePercent >= 0 : true
  const lineColor = isUp ? '#22c55e' : '#ef4444'

  const tooltipStyle = {
    backgroundColor: '#1a1a24',
    border: '1px solid #252530',
    borderRadius: 4,
    fontSize: '11px',
    color: '#eeeef5',
  }

  const chipStyle = (active: boolean) => ({
    fontSize: '10px', padding: '3px 10px', borderRadius: 2, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    color: active ? 'var(--gold)' : 'var(--muted)',
    background: active ? '#150f02' : 'transparent',
    fontFamily: 'var(--font-mono)',
  })

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '.65rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <select
          value={selectedTicker}
          onChange={e => onSelectTicker(e.target.value)}
          style={{ background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '4px 8px', borderRadius: 3, outline: 'none', cursor: 'pointer', maxWidth: 260 }}
        >
          {tickers.map(t => (
            <option key={t.ticker} value={t.ticker}>{t.ticker} — {t.name}</option>
          ))}
        </select>
        {RANGES.map(r => (
          <button key={r.label} style={chipStyle(range === r.days)} onClick={() => setRange(r.days)}>{r.label}</button>
        ))}
        {synthetic && <span style={{ fontSize: '9px', color: 'var(--muted)', marginLeft: 'auto' }}>Simulated data · Add Polygon key for real charts</span>}
      </div>

      {/* Quote summary */}
      {currentQuote && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '.75rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{selectedTicker}</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 8 }}>{currentQuote.name}</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 500, color: isUp ? 'var(--green)' : 'var(--red)' }}>
            ${currentQuote.price.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: isUp ? 'var(--green)' : 'var(--red)' }}>
            {isUp ? '+' : ''}{currentQuote.changePercent.toFixed(2)}% today
          </div>
          {currentQuote.pe && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>P/E {currentQuote.pe.toFixed(1)}</div>}
          {currentQuote.marketCap && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Cap ${(currentQuote.marketCap / 1e9).toFixed(0)}B</div>}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontSize: '12px' }}>Loading chart data...</div>
      ) : (
        <div style={{ padding: '1rem 1.5rem' }}>
          {/* Price chart */}
          <div style={{ marginBottom: '0.5rem', fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Price ({range}d)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history} margin={{ top: 5, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#12121a" />
              <XAxis dataKey="date" tick={{ fill: '#555566', fontSize: 9 }} tickLine={false} tickFormatter={d => d.slice(5)} />
              <YAxis orientation="right" tick={{ fill: '#555566', fontSize: 9 }} tickLine={false} tickFormatter={v => '$' + v.toFixed(0)} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => ['$' + v.toFixed(2), 'Close']} />
              <Line type="monotone" dataKey="close" stroke={lineColor} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: lineColor }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Volume chart */}
          <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Volume</div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={history} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={false} axisLine={false} />
              <YAxis orientation="right" tick={{ fill: '#555566', fontSize: 9 }} tickLine={false} tickFormatter={v => v >= 1e6 ? (v / 1e6).toFixed(0) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : String(v)} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [(v / 1e6).toFixed(1) + 'M', 'Volume']} />
              <Bar dataKey="volume" fill={lineColor + '66'} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
