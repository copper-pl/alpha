'use client'

import { useState } from 'react'
import type { StockQuote, AIMode, PositionWithQuote } from '@/types'

interface Props {
  stocks: StockQuote[]
  mode: AIMode
  title?: string
  portfolio?: PositionWithQuote[]
  expanded?: boolean
}

export default function AIPanel({ stocks, mode, title = 'AI Market Intelligence', portfolio, expanded = false }: Props) {
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [aiMode, setAiMode] = useState<AIMode>(mode)

  const runAnalysis = async (overrideMode?: AIMode) => {
    setLoading(true)
    setOutput('')
    const usedMode = overrideMode ?? aiMode
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: usedMode,
          stocks: stocks.slice(0, 15),
          portfolio,
          customPrompt: customPrompt || undefined,
        }),
      })
      const json = await res.json()
      if (json.data) setOutput(json.data)
      else setOutput(json.error ?? 'No response')
    } catch {
      setOutput('Failed to reach AI. Please try again.')
    }
    setLoading(false)
  }

  const panelStyle = {
    background: 'var(--s2)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: '0.85rem',
    margin: expanded ? 0 : '1rem 1.5rem 0',
    marginBottom: expanded ? 0 : '1rem',
  }

  const modes: { key: AIMode; label: string }[] = [
    { key: 'market', label: 'Market' },
    { key: 'sector', label: 'Sector' },
    { key: 'macro', label: 'Macro' },
    { key: 'screener', label: 'Screener' },
  ]

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--gold)' }}>{title}</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
          {expanded && modes.map(m => (
            <button
              key={m.key}
              onClick={() => setAiMode(m.key)}
              style={{
                fontSize: '9px', padding: '3px 7px', borderRadius: 2, cursor: 'pointer',
                border: `1px solid ${aiMode === m.key ? 'var(--gold)' : 'var(--border)'}`,
                color: aiMode === m.key ? 'var(--gold)' : 'var(--muted)',
                background: aiMode === m.key ? '#150f02' : 'transparent',
                fontFamily: 'var(--font-mono)',
              }}
            >{m.label}</button>
          ))}
          <button
            disabled={loading}
            onClick={() => runAnalysis()}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', background: '#150f02', color: 'var(--gold)', border: '1px solid #3a2a06', padding: '3px 9px', borderRadius: 2, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Analyzing...' : 'Analyze ↗'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginBottom: '.65rem' }}>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Or type a custom market question..."
            style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '7px', borderRadius: 3, outline: 'none', resize: 'vertical', minHeight: 50, lineHeight: 1.6 }}
          />
        </div>
      )}

      <div style={{ fontSize: '11px', color: loading ? 'var(--gold)' : output ? 'var(--text)' : 'var(--muted)', lineHeight: 1.75, minHeight: 40, whiteSpace: 'pre-wrap' }}>
        {loading ? 'Analyzing market data...' : output || `Click "Analyze" for AI insights on the current data.`}
      </div>
    </div>
  )
}
