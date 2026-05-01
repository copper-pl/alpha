// ─── Stock / Market ──────────────────────────────────────────────────────────

export interface StockQuote {
  ticker: string
  name: string
  price: number
  change: number        // absolute $
  changePercent: number // %
  volume: number
  marketCap: number | null
  pe: number | null
  high52w: number | null
  low52w: number | null
  sector: string
  open: number | null
  prevClose: number | null
  timestamp: number     // unix ms
}

export interface OHLCV {
  date: string   // YYYY-MM-DD
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface PolygonTickerDetails {
  ticker: string
  name: string
  market_cap: number | null
  description: string | null
  sic_description: string | null   // sector proxy
  homepage_url: string | null
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export interface Position {
  id: string
  user_id: string
  ticker: string
  shares: number
  avg_cost: number
  created_at: string
  updated_at: string
}

export interface PositionWithQuote extends Position {
  quote: StockQuote | null
  marketValue: number
  gainLoss: number
  gainLossPercent: number
  dailyPnL: number
}

// ─── Watchlist ───────────────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string
  user_id: string
  ticker: string
  created_at: string
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export type AIMode = 'market' | 'sector' | 'macro' | 'screener' | 'portfolio_risk' | 'portfolio_rebal' | 'portfolio_outlook'

export interface AIRequest {
  mode: AIMode
  stocks?: StockQuote[]
  portfolio?: PositionWithQuote[]
  customPrompt?: string
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// ─── UI ──────────────────────────────────────────────────────────────────────

export type SortKey = 'ticker' | 'price' | 'changePercent' | 'volume' | 'marketCap' | 'pe'
export type SortDir = 'asc' | 'desc'

export interface SortState {
  key: SortKey
  dir: SortDir
}
