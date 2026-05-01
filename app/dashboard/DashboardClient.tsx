'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { StockQuote, WatchlistItem, Position, PositionWithQuote, SortKey, SortDir } from '@/types'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import StockTable from '@/components/market/StockTable'
import IndexBar from '@/components/market/IndexBar'
import PortfolioPanel from '@/components/portfolio/PortfolioPanel'
import ChartPanel from '@/components/charts/ChartPanel'
import AIPanel from '@/components/market/AIPanel'

type Tab = 'market' | 'watchlist' | 'portfolio' | 'charts' | 'ai'
const SECTORS = ['All','Technology','Finance','Healthcare','Energy','Consumer','Industrial','Real Estate','Utilities','Materials','Telecom']
const REFRESH_INTERVAL = 30_000 // 30 seconds

interface Props {
  user: User
  initialWatchlist: WatchlistItem[]
  initialPortfolio: Position[]
}

export default function DashboardClient({ user, initialWatchlist, initialPortfolio }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('market')
  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [sector, setSector] = useState('All')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('changePercent')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [watchlist, setWatchlist] = useState<string[]>(initialWatchlist.map(w => w.ticker))
  const [portfolio, setPortfolio] = useState<Position[]>(initialPortfolio)
  const [selectedChartTicker, setSelectedChartTicker] = useState('AAPL')

  const [clock, setClock] = useState('')
  const supabase = createClient()
  const router = useRouter()

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Fetch quotes
  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/stocks')
      const json = await res.json()
      if (json.data) {
        setQuotes(json.data)
        setLastUpdated(new Date())
      }
    } catch (e) {
      console.error('Failed to fetch quotes:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotes()
    const id = setInterval(fetchQuotes, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchQuotes])

  // Filtering + sorting
  const filtered = quotes
    .filter(q => sector === 'All' || q.sector === sector)
    .filter(q => {
      if (!search) return true
      const s = search.toLowerCase()
      return q.ticker.toLowerCase().includes(s) || q.name.toLowerCase().includes(s)
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv as string) : (bv as string).localeCompare(av)
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const watchlistQuotes = quotes.filter(q => watchlist.includes(q.ticker))

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  // Portfolio with live quotes
  const portfolioWithQuotes: PositionWithQuote[] = portfolio.map(pos => {
    const quote = quotes.find(q => q.ticker === pos.ticker) ?? null
    const price = quote?.price ?? pos.avg_cost
    const marketValue = price * pos.shares
    const gainLoss = marketValue - pos.avg_cost * pos.shares
    const gainLossPercent = ((price - pos.avg_cost) / pos.avg_cost) * 100
    const dailyPnL = quote ? (quote.changePercent / 100) * marketValue : 0
    return { ...pos, quote, marketValue, gainLoss, gainLossPercent, dailyPnL }
  })

  // Watchlist actions
  const toggleWatch = async (ticker: string) => {
    const isOn = watchlist.includes(ticker)
    setWatchlist(prev => isOn ? prev.filter(t => t !== ticker) : [...prev, ticker])
    if (isOn) {
      await fetch(`/api/watchlist?ticker=${ticker}`, { method: 'DELETE' })
    } else {
      await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker }) })
    }
  }

  // Portfolio actions
  const addPosition = async (ticker: string, shares: number, avg_cost: number) => {
    const res = await fetch('/api/portfolio', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticker, shares, avg_cost }),
    })
    const json = await res.json()
    if (json.data) {
      setPortfolio(prev => {
        const existing = prev.findIndex(p => p.ticker === ticker)
        if (existing >= 0) { const updated = [...prev]; updated[existing] = json.data; return updated }
        return [json.data, ...prev]
      })
    }
    return json
  }
  const removePosition = async (ticker: string) => {
    await fetch(`/api/portfolio?ticker=${ticker}`, { method: 'DELETE' })
    setPortfolio(prev => prev.filter(p => p.ticker !== ticker))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const s = (name: string) => ({ fontSize: '9px', padding: '3px 9px', borderRadius: 2, cursor: 'pointer', border: `1px solid ${sector === name ? 'var(--gold)' : 'var(--border)'}`, color: sector === name ? 'var(--gold)' : 'var(--muted)', background: sector === name ? '#150f02' : 'transparent', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' as const, transition: 'all .15s' })
const tabStyle = (t: Tab) => ({
    padding: '.6rem 1rem', fontSize: '11px',
    color: activeTab === t ? 'var(--gold)' : 'var(--muted)',
    cursor: 'pointer',
    borderBottom: '2px solid ' + (activeTab === t ? 'var(--gold)' : 'transparent'),
    transition: 'all .15s', whiteSpace: 'nowrap' as const,
  })

  const tabLabel = (t: Tab) => {
    if (t === 'market') return 'Market (' + filtered.length + ')'
    if (t === 'watchlist') return 'Watchlist (' + watchlist.length + ')'
    if (t === 'portfolio') return 'Portfolio (' + portfolio.length + ')'
    if (t === 'charts') return 'Charts'
    return 'AI Insights'
  }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold)' }}>
          MARKET<span style={{ color: 'var(--muted)', fontWeight: 400 }}>PULSE</span>
          <span style={{ fontSize: '9px', background: '#1a0f02', color: 'var(--gold)', padding: '2px 5px', borderRadius: 2, border: '1px solid #3a2606', marginLeft: 6 }}>PRO</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {loading ? (
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Refreshing...</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '10px', color: 'var(--green)' }}>
              <div className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)' }} />
              LIVE
            </div>
          )}
          <div style={{ fontSize: '10px', color: 'var(--muted)' }}>NYSE {clock}</div>
          <button onClick={fetchQuotes} style={{ fontSize: '9px', padding: '3px 8px', background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 2, cursor: 'pointer' }}>↻ Refresh</button>
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{user.email}</span>
          <button onClick={handleSignOut} style={{ fontSize: '9px', padding: '3px 8px', background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 2, cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      {/* Index Bar */}
      <IndexBar quotes={quotes} />

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--s1)', overflowX: 'auto' }}>
        {(['market', 'watchlist', 'portfolio', 'charts', 'ai'] as Tab[]).map(t => (
          <div key={t} onClick={() => setActiveTab(t)} style={tabStyle(t)}>
           {tabLabel(t)}
          </div>
        ))}
      </div>

      {/* Market Tab */}
      {activeTab === 'market' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '.6rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--s1)' }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search ticker or company..."
              style={{ background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '5px 10px', borderRadius: 3, outline: 'none', width: 220 }}
            />
            {lastUpdated && <span style={{ fontSize: '9px', color: 'var(--muted)', marginLeft: 'auto' }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '.55rem 1.5rem', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexWrap: 'nowrap' }}>
            {SECTORS.map(sec => (
              <button key={sec} style={s(sec)} onClick={() => { setSector(sec); setPage(1) }}>{sec}</button>
            ))}
          </div>
          <StockTable
            stocks={paginated}
            watchlist={watchlist}
            onToggleWatch={toggleWatch}
            onSort={handleSort}
            sortKey={sortKey}
            sortDir={sortDir}
            onSelectChart={t => { setSelectedChartTicker(t); setActiveTab('charts') }}
          />
          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '.5rem 1.5rem', borderTop: '1px solid var(--border)', fontSize: '10px', color: 'var(--muted)' }}>
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '3px 10px', borderRadius: 2, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '3px 10px', borderRadius: 2, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1 }}>Next →</button>
            <span style={{ marginLeft: 'auto' }}>{PAGE_SIZE} per page · {filtered.length} total</span>
          </div>
          <AIPanel stocks={quotes.sort((a,b) => b.changePercent - a.changePercent).slice(0,10)} mode="market" />
        </>
      )}

      {/* Watchlist Tab */}
      {activeTab === 'watchlist' && (
        <>
          {watchlistQuotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--muted)', fontSize: '12px' }}>
              No stocks in watchlist.<br />
              <span style={{ fontSize: '10px', marginTop: 6, display: 'block' }}>Go to Market and click ☆ to add stocks.</span>
            </div>
          ) : (
            <StockTable
              stocks={watchlistQuotes}
              watchlist={watchlist}
              onToggleWatch={toggleWatch}
              onSort={handleSort}
              sortKey={sortKey}
              sortDir={sortDir}
              onSelectChart={t => { setSelectedChartTicker(t); setActiveTab('charts') }}
            />
          )}
          <AIPanel stocks={watchlistQuotes} mode="market" title="Watchlist Intelligence" />
        </>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <PortfolioPanel
          positions={portfolioWithQuotes}
          onAdd={addPosition}
          onRemove={removePosition}
          availableTickers={quotes.map(q => q.ticker)}
        />
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <ChartPanel
          tickers={quotes.map(q => ({ ticker: q.ticker, name: q.name }))}
          selectedTicker={selectedChartTicker}
          onSelectTicker={setSelectedChartTicker}
          currentQuote={quotes.find(q => q.ticker === selectedChartTicker)}
        />
      )}

      {/* AI Insights Tab */}
      {activeTab === 'ai' && (
        <div style={{ padding: '1rem 1.5rem' }}>
          <AIPanel stocks={quotes.sort((a,b) => b.changePercent - a.changePercent).slice(0,15)} mode="market" title="Market Overview" expanded />
          <div style={{ marginTop: '1rem' }}>
            <AIPanel stocks={quotes} mode="sector" title="Sector Rotation Analysis" expanded />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <AIPanel stocks={quotes.sort((a,b) => b.changePercent - a.changePercent).slice(0,10)} mode="screener" title="AI Stock Screener" expanded />
          </div>
        </div>
      )}
    </div>
  )
}
