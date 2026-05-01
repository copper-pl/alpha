import { NextRequest, NextResponse } from 'next/server'
import { fetchSnapshots, fetchTickerDetails, STOCK_UNIVERSE, SECTOR_MAP } from '@/lib/polygon'
import type { StockQuote } from '@/types'

// Cache responses for 60 seconds to respect Polygon rate limits
export const revalidate = 60

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tickersParam = searchParams.get('tickers')
  const tickers = tickersParam
    ? tickersParam.split(',').map(t => t.trim().toUpperCase())
    : STOCK_UNIVERSE

  try {
    // Fetch snapshots in batches of 50 (Polygon limit per call)
    const batches: string[][] = []
    for (let i = 0; i < tickers.length; i += 50) {
      batches.push(tickers.slice(i, i + 50))
    }

    const results = await Promise.all(batches.map(batch => fetchSnapshots(batch)))
    let quotes: StockQuote[] = results.flat()

    // If no Polygon key, return mock data so UI still works
    if (quotes.length === 0) {
      quotes = getMockQuotes(tickers)
    }

    return NextResponse.json({ data: quotes })
  } catch (error) {
    console.error('Stock API error:', error)
    // Fallback to mock data on error so the app stays functional
    const mockQuotes = getMockQuotes(tickers)
    return NextResponse.json({ data: mockQuotes, warning: 'Using simulated data' })
  }
}

// ─── Mock data fallback (when no Polygon key is configured) ──────────────────
const MOCK_BASE: Record<string, { name: string; price: number; pe: number | null; cap: number }> = {
  AAPL:{name:'Apple Inc',price:213.49,pe:33.2,cap:3300e9},
  MSFT:{name:'Microsoft Corp',price:425.52,pe:36.7,cap:3200e9},
  NVDA:{name:'NVIDIA Corp',price:138.52,pe:62.4,cap:3400e9},
  GOOGL:{name:'Alphabet Inc',price:171.85,pe:21.8,cap:2100e9},
  META:{name:'Meta Platforms',price:589.34,pe:28.1,cap:1500e9},
  AMZN:{name:'Amazon.com Inc',price:225.18,pe:45.2,cap:2400e9},
  TSLA:{name:'Tesla Inc',price:274.80,pe:77.2,cap:878e9},
  AVGO:{name:'Broadcom Inc',price:188.92,pe:32.1,cap:880e9},
  AMD:{name:'Advanced Micro Devices',price:104.35,pe:52.8,cap:169e9},
  INTC:{name:'Intel Corp',price:21.44,pe:null,cap:91e9},
  ORCL:{name:'Oracle Corp',price:168.22,pe:42.3,cap:462e9},
  CRM:{name:'Salesforce Inc',price:284.90,pe:38.4,cap:274e9},
  ADBE:{name:'Adobe Inc',price:374.10,pe:26.9,cap:165e9},
  NOW:{name:'ServiceNow Inc',price:898.25,pe:84.1,cap:184e9},
  SNOW:{name:'Snowflake Inc',price:148.70,pe:null,cap:50e9},
  PLTR:{name:'Palantir Technologies',price:112.40,pe:310.2,cap:242e9},
  JPM:{name:'JPMorgan Chase',price:234.90,pe:13.2,cap:671e9},
  BAC:{name:'Bank of America',price:42.15,pe:14.1,cap:328e9},
  GS:{name:'Goldman Sachs',price:512.70,pe:14.8,cap:167e9},
  MS:{name:'Morgan Stanley',price:118.42,pe:19.2,cap:193e9},
  WFC:{name:'Wells Fargo',price:74.82,pe:14.6,cap:247e9},
  V:{name:'Visa Inc',price:344.20,pe:32.4,cap:712e9},
  MA:{name:'Mastercard Inc',price:538.90,pe:37.8,cap:500e9},
  AXP:{name:'American Express',price:280.55,pe:20.4,cap:202e9},
  BLK:{name:'BlackRock Inc',price:994.80,pe:22.3,cap:151e9},
  SCHW:{name:'Charles Schwab',price:80.42,pe:26.1,cap:148e9},
  LLY:{name:'Eli Lilly & Co',price:832.45,pe:88.3,cap:790e9},
  UNH:{name:'UnitedHealth Group',price:580.20,pe:22.1,cap:535e9},
  JNJ:{name:'Johnson & Johnson',price:158.40,pe:16.2,cap:382e9},
  ABBV:{name:'AbbVie Inc',price:198.72,pe:48.2,cap:350e9},
  MRK:{name:'Merck & Co',price:102.34,pe:13.1,cap:259e9},
  PFE:{name:'Pfizer Inc',price:27.18,pe:10.8,cap:154e9},
  TMO:{name:'Thermo Fisher Scientific',price:482.30,pe:29.4,cap:184e9},
  ISRG:{name:'Intuitive Surgical',price:524.80,pe:72.1,cap:184e9},
  XOM:{name:'ExxonMobil Corp',price:115.30,pe:14.1,cap:457e9},
  CVX:{name:'Chevron Corp',price:152.42,pe:15.2,cap:280e9},
  COP:{name:'ConocoPhillips',price:98.74,pe:13.8,cap:130e9},
  SLB:{name:'SLB',price:38.52,pe:14.2,cap:55e9},
  OXY:{name:'Occidental Petroleum',price:44.82,pe:17.4,cap:40e9},
  COST:{name:'Costco Wholesale',price:968.20,pe:54.1,cap:427e9},
  WMT:{name:'Walmart Inc',price:98.42,pe:38.2,cap:790e9},
  MCD:{name:"McDonald's Corp",price:294.10,pe:24.8,cap:213e9},
  SBUX:{name:'Starbucks Corp',price:82.34,pe:26.4,cap:93e9},
  NKE:{name:'Nike Inc',price:58.42,pe:20.1,cap:87e9},
  TGT:{name:'Target Corp',price:98.74,pe:14.2,cap:46e9},
  CAT:{name:'Caterpillar Inc',price:342.80,pe:17.8,cap:161e9},
  BA:{name:'Boeing Co',price:178.42,pe:null,cap:133e9},
  RTX:{name:'RTX Corp',price:128.52,pe:34.2,cap:170e9},
  HON:{name:'Honeywell Intl',price:214.30,pe:21.4,cap:137e9},
  PLD:{name:'Prologis Inc',price:112.84,pe:38.2,cap:105e9},
  AMT:{name:'American Tower',price:198.42,pe:44.1,cap:93e9},
  NEE:{name:'NextEra Energy',price:68.42,pe:22.1,cap:139e9},
  LIN:{name:'Linde PLC',price:448.20,pe:32.4,cap:212e9},
  FCX:{name:'Freeport-McMoRan',price:38.92,pe:22.8,cap:57e9},
  T:{name:'AT&T Inc',price:22.84,pe:16.2,cap:164e9},
  VZ:{name:'Verizon Communications',price:42.18,pe:10.4,cap:177e9},
}

function getMockQuotes(tickers: string[]): StockQuote[] {
  return tickers
    .filter(t => MOCK_BASE[t])
    .map(ticker => {
      const base = MOCK_BASE[ticker]
      const chgPct = (Math.random() - 0.47) * 6
      const change = base.price * (chgPct / 100)
      return {
        ticker,
        name: base.name,
        price: +(base.price + change * 0.1).toFixed(2),
        change: +change.toFixed(2),
        changePercent: +chgPct.toFixed(2),
        volume: Math.floor(Math.random() * 50e6 + 1e6),
        marketCap: base.cap,
        pe: base.pe,
        high52w: +(base.price * 1.35).toFixed(2),
        low52w: +(base.price * 0.65).toFixed(2),
        sector: SECTOR_MAP[ticker] ?? 'Other',
        open: +(base.price * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2),
        prevClose: +(base.price).toFixed(2),
        timestamp: Date.now(),
      }
    })
}
