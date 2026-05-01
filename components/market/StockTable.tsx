'use client'

import type { StockQuote, SortKey, SortDir } from '@/types'

function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  return (n / 1e3).toFixed(0) + 'K'
}

function fmtCap(n: number | null) {
  if (!n) return '—'
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(0) + 'B'
  return '$' + (n / 1e6).toFixed(0) + 'M'
}

function Signal({ chg }: { chg: number }) {
  const [label, color, bg] =
    chg > 4 ? ['STRONG BUY', 'var(--green)', '#041a0a'] :
    chg > 1.5 ? ['BUY', 'var(--green)', '#041a0a'] :
    chg > 0 ? ['HOLD', 'var(--gold)', '#1a1404'] :
    chg > -1.5 ? ['WATCH', 'var(--red)', '#1a0404'] :
    ['SELL', 'var(--red)', '#1a0404']
  return <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 2, fontSize: '9px', fontWeight: 500, color, background: bg }}>{label}</span>
}

interface Props {
  stocks: StockQuote[]
  watchlist: string[]
  onToggleWatch: (ticker: string) => void
  onSort: (key: SortKey) => void
  sortKey: SortKey
  sortDir: SortDir
  onSelectChart: (ticker: string) => void
}

export default function StockTable({ stocks, watchlist, onToggleWatch, onSort, sortKey, sortDir, onSelectChart }: Props) {
  const th = (label: string, key?: SortKey) => (
    <th
      key={label}
      onClick={key ? () => onSort(key) : undefined}
      style={{
        fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.07em',
        color: sortKey === key ? 'var(--gold)' : 'var(--muted)', textAlign: 'right',
        padding: '.5rem .4rem', borderBottom: '1px solid var(--border)',
        cursor: key ? 'pointer' : 'default', whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {label}{key && sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
    </th>
  )

  return (
    <div style={{ padding: '0 1.5rem', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: 720 }}>
        <thead>
          <tr>
            <th style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--muted)', textAlign: 'left', padding: '.5rem .4rem', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onSort('ticker')}>
              Ticker {sortKey === 'ticker' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
            </th>
            <th style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'left', padding: '.5rem .4rem', borderBottom: '1px solid var(--border)' }}>Company</th>
            <th style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'left', padding: '.5rem .4rem', borderBottom: '1px solid var(--border)' }}>Sector</th>
            {th('Price', 'price')}
            {th('Chg%', 'changePercent')}
            {th('Volume', 'volume')}
            {th('Mkt Cap', 'marketCap')}
            {th('P/E', 'pe')}
            <th style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'right', padding: '.5rem .4rem', borderBottom: '1px solid var(--border)' }}>Signal</th>
            <th style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center', padding: '.5rem .4rem', borderBottom: '1px solid var(--border)' }}>Chart</th>
            <th style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center', padding: '.5rem .4rem', borderBottom: '1px solid var(--border)' }}>Watch</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map(s => {
            const isUp = s.changePercent >= 0
            const inWatch = watchlist.includes(s.ticker)
            return (
              <tr key={s.ticker} style={{ transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0c0c16')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', textAlign: 'left' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 600 }}>{s.ticker}</span>
                </td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', color: 'var(--muted)', fontSize: '10px', textAlign: 'left', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.name}>{s.name}</td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', textAlign: 'left' }}>
                  <span style={{ fontSize: '9px', padding: '1px 5px', background: 'var(--s3)', borderRadius: 2, color: 'var(--muted)' }}>{s.sector}</span>
                </td>
                <td id={`px-${s.ticker}`} style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', color: isUp ? 'var(--green)' : 'var(--red)', textAlign: 'right', fontWeight: 500 }}>
                  ${s.price.toFixed(2)}
                </td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 2, fontSize: '9px', fontWeight: 500, color: isUp ? 'var(--green)' : 'var(--red)', background: isUp ? '#041a0a' : '#1a0404' }}>
                    {isUp ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </span>
                </td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', color: 'var(--muted)', textAlign: 'right' }}>{fmtVol(s.volume)}</td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', color: 'var(--muted)', textAlign: 'right' }}>{fmtCap(s.marketCap)}</td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', color: 'var(--muted)', textAlign: 'right' }}>{s.pe?.toFixed(1) ?? '—'}</td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', textAlign: 'right' }}><Signal chg={s.changePercent} /></td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', textAlign: 'center' }}>
                  <button onClick={() => onSelectChart(s.ticker)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '9px', padding: '2px 5px', borderRadius: 2, cursor: 'pointer' }}>📈</button>
                </td>
                <td style={{ padding: '.42rem .4rem', borderBottom: '1px solid #0e0e18', textAlign: 'center' }}>
                  <button
                    onClick={() => onToggleWatch(s.ticker)}
                    style={{ background: inWatch ? '#040d04' : 'none', border: `1px solid ${inWatch ? '#1a4a1a' : 'var(--border)'}`, color: inWatch ? 'var(--green)' : 'var(--muted)', fontSize: '11px', padding: '2px 6px', borderRadius: 2, cursor: 'pointer' }}
                  >
                    {inWatch ? '★' : '☆'}
                  </button>
                </td>
              </tr>
            )
          })}
          {stocks.length === 0 && (
            <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontSize: '12px' }}>No stocks match your filter.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
