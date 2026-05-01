'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>
            MARKET<span style={{ color: 'var(--muted)', fontWeight: 400 }}>PULSE</span>
            <span style={{ fontSize: '0.65rem', background: '#1a0f02', color: 'var(--gold)', padding: '2px 6px', borderRadius: 3, border: '1px solid #3a2606', marginLeft: 8 }}>PRO</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>Real-time markets. AI-powered insights.</p>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Sign in</h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '8px 10px', borderRadius: 3, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%', background: 'var(--s3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '8px 10px', borderRadius: 3, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            {error && <p style={{ fontSize: '0.7rem', color: 'var(--red)', marginBottom: '0.75rem' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: 'var(--gold)', color: '#000', border: 'none', fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700, padding: '9px', borderRadius: 3, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center', marginTop: '1rem' }}>
            No account?{' '}
            <Link href="/signup" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
