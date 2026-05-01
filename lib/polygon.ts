/**
 * Polygon.io API client — SERVER ONLY
 * API key is never sent to the browser.
 *
 * Free tier:  5 req/min, 15-min delayed data
 * Starter:    unlimited req/min, real-time data ($29/mo)
 * https://polygon.io/dashboard
 */

import type { StockQuote, OHLCV } from '@/types'

const BASE = 'https://api.polygon.io'
const KEY = process.env.POLYGON_API_KEY!

// Our default universe — extend freely
export const STOCK_UNIVERSE = [
  // Technology
  'AAPL','MSFT','NVDA','GOOGL','META','AMZN','TSLA','AVGO',
  'AMD','INTC','ORCL','CRM','ADBE','NOW','SNOW','PLTR',
  // Finance
  'JPM','BAC','GS','MS','WFC','V','MA','AXP','BLK','SCHW',
  // Healthcare
  'LLY','UNH','JNJ','ABBV','MRK','PFE','TMO','ISRG',
  // Energy
  'XOM','CVX','COP','SLB','OXY',
  // Consumer
  'COST','WMT','MCD','SBUX','NKE','TGT',
  // Industrial
  'CAT','BA','RTX','HON',
  // Other
  'PLD','AMT','NEE','LIN','FCX','T','VZ',
]

// Sector map (Polygon doesn't always return sector cleanly)
export const SECTOR_MAP: Record<string, string> = {
  AAPL:'Technology',MSFT:'Technology',NVDA:'Technology',GOOGL:'Technology',
  META:'Technology',AMZN:'Technology',TSLA:'Technology',AVGO:'Technology',
  AMD:'Technology',INTC:'Technology',ORCL:'Technology',CRM:'Technology',
  ADBE:'Technology',NOW:'Technology',SNOW:'Technology',PLTR:'Technology',
  JPM:'Finance',BAC:'Finance',GS:'Finance',MS:'Finance',WFC:'Finance',
  V:'Finance',MA:'Finance',AXP:'Finance',BLK:'Finance',SCHW:'Finance',
  LLY:'Healthcare',UNH:'Healthcare',JNJ:'Healthcare',ABBV:'Healthcare',
  MRK:'Healthcare',PFE:'Healthcare',TMO:'Healthcare',ISRG:'Healthcare',
  XOM:'Energy',CVX:'Energy',COP:'Energy',SLB:'Energy',OXY:'Energy',
  COST:'Consumer',WMT:'Consumer',MCD:'Consumer',SBUX:'Consumer',NKE:'Consumer',TGT:'Consumer',
  CAT:'Industrial',BA:'Industrial',RTX:'Industrial',HON:'Industrial',
  PLD:'Real Estate',AMT:'Real Estate',NEE:'Utilities',LIN:'Materials',
  FCX:'Materials',T:'Telecom',VZ:'Telecom',
}

async function polygonFetch<T>(path: string): Promise<T | null> {
  if (!KEY) {
    console.error('POLYGON_API_KEY is not set')
    return null
  }
  try {
    const res = await fetch(`${BASE}${path}&apiKey=${KEY}`, {
      next: { revalidate: 60 }, // cache 60s
    })
    if (!res.ok) {
      console.error(`Polygon ${path} → ${res.status}`)
      return null
    }
    return res.json()
  } catch (e) {
    console.error('Polygon fetch error:', e)
    return null
  }
}

/**
 * Fetch snapshot (price, change, volume) for a batch of tickers.
 * Uses /v2/snapshot/locale/us/markets/stocks/tickers endpoint.
 * One call for up to 50 tickers.
 */
export async function fetchSnapshots(tickers: string[]): Promise<StockQuote[]> {
  const chunk = tickers.slice(0, 50).join(',')
  const data = await polygonFetch<any>(
    `/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${chunk}`
  )

  if (!data?.tickers) return []

  return data.tickers.map((t: any): StockQuote => ({
    ticker: t.ticker,
    name: t.ticker, // enriched separately if needed
    price: t.day?.c ?? t.prevDay?.c ?? 0,
    change: t.todaysChange ?? 0,
    changePercent: t.todaysChangePerc ?? 0,
    volume: t.day?.v ?? 0,
    marketCap: null, // from details endpoint
    pe: null,
    high52w: null,
    low52w: null,
    sector: SECTOR_MAP[t.ticker] ?? 'Other',
    open: t.day?.o ?? null,
    prevClose: t.prevDay?.c ?? null,
    timestamp: Date.now(),
  }))
}

/**
 * Fetch single ticker details (name, market cap, description).
 */
export async function fetchTickerDetails(ticker: string): Promise<Partial<StockQuote> | null> {
  const data = await polygonFetch<any>(`/v3/reference/tickers/${ticker}?`)
  if (!data?.results) return null
  const r = data.results
  return {
    name: r.name ?? ticker,
    marketCap: r.market_cap ?? null,
  }
}

/**
 * Fetch OHLCV history for a ticker.
 * multiplier=1, timespan=day → daily candles
 */
export async function fetchAggregates(
  ticker: string,
  days: number = 90
): Promise<OHLCV[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  const fromStr = from.toISOString().split('T')[0]
  const toStr = to.toISOString().split('T')[0]

  const data = await polygonFetch<any>(
    `/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=120`
  )

  if (!data?.results) return []

  return data.results.map((r: any): OHLCV => ({
    date: new Date(r.t).toISOString().split('T')[0],
    open: r.o,
    high: r.h,
    low: r.l,
    close: r.c,
    volume: r.v,
  }))
}

/**
 * Fetch real-time quote for a single ticker (WebSocket alternative for polling).
 */
export async function fetchSingleQuote(ticker: string): Promise<StockQuote | null> {
  const quotes = await fetchSnapshots([ticker])
  return quotes[0] ?? null
}
