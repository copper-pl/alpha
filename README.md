# MarketPulse Pro

Production-ready stock tracker: **Next.js 14 · Supabase · Polygon.io · Claude AI**

## Quick Start

### 1. Install
```bash
npm install
cp .env.local.example .env.local
```

### 2. Set up Supabase
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Copy URL + anon key to `.env.local`

### 3. Get API keys
- **Polygon.io** — polygon.io (free: 5 req/min delayed data)
- **Anthropic** — console.anthropic.com

### 4. Run
```bash
npm run dev   # localhost:3000
```

### 5. Deploy
```bash
vercel        # add env vars in Vercel dashboard
```

## Architecture
- `app/api/stocks/` — Polygon.io quotes (server-only)
- `app/api/ai/` — Anthropic AI (auth-gated, server-only)
- `app/api/watchlist/` — Supabase CRUD (auth-gated)
- `app/api/portfolio/` — Supabase CRUD (auth-gated)
- `lib/polygon.ts` — Polygon client (API key never reaches browser)
- `supabase/schema.sql` — Run once in Supabase SQL Editor

## Security
- API keys are server-only (never in NEXT_PUBLIC_*)
- All data routes verify Supabase auth
- Row Level Security on all tables
