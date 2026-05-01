'use client'

import { useState } from 'react'
import type { PositionWithQuote } from '@/types'
import AIPanel from '@/components/market/AIPanel'

function fmtMoney(n: number) {
  return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  positions: PositionWithQuote[]
  onAdd: (ticker: string, shares: number, avg_cost: number) => Promise<any>
  onRemove: (ticker: string) => void
  availableTickers: string[]
}

export default function PortfolioPanel({ positions, onAdd, onRemove, availableTickers }: Props) {
  const [ticker, setTicker] = useState('')
  const [shares, setShares] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')

  const totalValue = positions.reduce((a, b) => a + b.marketValue, 0)
  const totalGL = positions.reduce((a, b) => a + b.gainLoss, 0)
  const totalDaily = positions.reduce((a, b) => a + b.dailyPnL, 0)
  const totalCost = positions.reduce((a, b) => a + b.avg_cost * b.shares, 0)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    const t = ticker.trim().toUpperCase()
    const sh = parseFloat(shares)
    const co = parseFloat(avgCost)
    if (!t) return setErr('Ticker is required')
    if (!sh || sh <= 0) return setErr('Shares must be positive')
    if (!co || co <= 0) return setErr('Cost basis must be positive')
    setAdding(true)
    const res = await onAdd(t, sh, co)
    if (res?.error) setErr(res.error)
    else { setTicker(''); setShares(''); setAvgCost('') }
    setAdding(false)
  }

  const inputStyle = {
    background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)',
    fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '5px 8px', borderRadius: 3, outline: 'none',
  }

  const metric = (label: string, val: string, color: string) => (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 4, padding: '.75rem 1rem' }}>
      <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '17px', fontWeight: 500, color }}>{val}</div>
    </div>
  )

  return (
    <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {metric('Portfolio Value', fmtMoney(totalValue), 'var(--gold)')}
        {metric('Total G/L', (totalGL >= 0 ? '+' : '') + fmtMoney(totalGL), totalGL >= 0 ? 'var(--green)' : 'var(--red)')}
        {metric('Daily P&L', (totalDaily >= 0 ? '+' : '') + fmtMoney(totalDaily), totalDaily >= 0 ? 'var(--green)' : 'var(--red)')}
        {metric('Positions', String(positions.length), 'var(--gold)')}
      </div>

      {/* Add form */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 4, padding: '1rem' }}>
        <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.65rem' }}>Add Position</div>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <input list="tickers-list" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="TICKER" style={{ ...inputStyle, width: 90, textTransform: 'uppercase' }} />
          <datalist id="tickers-list">{availableTickers.map(t => <option key={t} value={t} />)}</datalist>
          <input type="number" value={shares} onChange={e => setShares(e.target.value)} placeholder="Shares" min={0.001} step={0.001} style={{ ...inputStyle, width: 90 }} />
          <input type="number" value={avgCost} onChange={e => setAvgCost(e.target.value)} placeholder="Avg cost $" min={0.01} step={0.01} style={{ ...inputStyle, width: 100 }} />
          <button type="submit" disabled={adding} style={{ background: 'var(--gold)', color: '#000', border: 'none', fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, padding: '6px 12px', borderRadius: 3, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.6 : 1 }}>
            {adding ? '...' : 'Add'}
          </button>
        </form>
        {err && <p style={{ fontSize: '10px', color: 'var(--red)', marginTop: 5 }}>{err}</p>}
      </div>

      {/* Holdings */}
      <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 4, padding: '1rem' }}>
        <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.65rem' }}>Holdings</div>
        {positions.length === 0 ? (
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>No positions yet. Add your first holding above.</div>
        ) : positions.map(pos => {
          const allocation = totalValue > 0 ? (pos.marketValue / totalValue * 100).toFixed(1) : '0.0'
          return (
            <div key={pos.ticker} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid #0e0e16', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600, minWidth: 48 }}>{pos.ticker}</div>
                <div>
                  <div style={{ fontSize: '11px' }}>{pos.quote?.name ?? pos.ticker}</div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{pos.shares} sh @ ${pos.avg_cost.toFixed(2)} · {allocation}% of portfolio</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '11px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500 }}>${pos.quote?.price.toFixed(2) ?? '—'}</div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)' }}>current</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500 }}>{fmtMoney(pos.marketValue)}</div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)' }}>value</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500, color: pos.gainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {pos.gainLoss >= 0 ? '+' : ''}{fmtMoney(pos.gainLoss)}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{pos.gainLossPercent >= 0 ? '+' : ''}{pos.gainLossPercent.toFixed(1)}%</div>
                </div>
                <button onClick={() => onRemove(pos.ticker)} style={{ background: '#1a0404', color: 'var(--red)', border: '1px solid #2a0808', fontFamily: 'var(--font-mono)', fontSize: '9px', padding: '2px 5px', borderRadius: 2, cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          )
        })}
        {positions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.75rem', fontSize: '11px', color: 'var(--muted)', paddingTop: '.5rem', borderTop: '1px solid var(--border)' }}>
            <span>Total invested: {fmtMoney(totalCost)}</span>
            <span>Current value: {fmtMoney(totalValue)}</span>
            <span style={{ color: totalGL >= 0 ? 'var(--green)' : 'var(--red)' }}>Return: {totalCost > 0 ? ((totalGL / totalCost) * 100).toFixed(2) : '0.00'}%</span>
          </div>
        )}
      </div>

      {/* Portfolio AI */}
      {positions.length > 0 && (
        <div>
          <AIPanel
            stocks={positions.map(p => p.quote!).filter(Boolean)}
            mode="portfolio_risk"
            title="Portfolio AI Advisor"
            portfolio={positions}
          />
        </div>
      )}
    </div>
  )
}
