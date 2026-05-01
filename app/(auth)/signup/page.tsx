'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a confirmation link.')
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'var(--s3)', border: '1px solid var(--border)',
    color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
    padding: '8px 10px', borderRadius: 3, outline: 'none'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>
            MARKET<span style={{ color: 'var(--muted)', fontWeight: 400 }}>PULSE</span>
            <span style={{ fontSize: '0.65rem', background: '#1a0f02', color: 'var(--gold)', padding: '2px 6px', borderRadius: 3, border: '1px solid #3a2606', marginLeft: 8 }}>PRO</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>Create your free account</p>
        </div>

        <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 6, padding: '1.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Create Account</h1>
          {message ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--green)', marginBottom: '1rem' }}>{message}</p>
              <Link href="/login" style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" style={inputStyle} />
              </div>
              {error && <p style={{ fontSize: '0.7rem', color: 'var(--red)', marginBottom: '0.75rem' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width: '100%', background: 'var(--gold)', color: '#000', border: 'none', fontFamily: 'var(--font-display)', fontSize: '0.8rem', fontWeight: 700, padding: '9px', borderRadius: 3, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}
          {!message && (
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center', marginTop: '1rem' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
