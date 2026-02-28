'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      {/* Blueprint grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(74,158,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,255,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
            <polygon points="20,3 37,33 3,33" fill="none" stroke="rgba(244,242,238,0.9)" strokeWidth="1.8" strokeLinejoin="miter"/>
            <line x1="20" y1="11" x2="20" y2="32.5" stroke="rgba(244,242,238,0.2)" strokeWidth="0.9" strokeDasharray="1.5 2.5"/>
            <line x1="0" y1="37" x2="40" y2="37" stroke="#4a9eff" strokeWidth="2.2" strokeLinecap="square"/>
            <line x1="7" y1="37" x2="7" y2="40" stroke="#4a9eff" strokeWidth="1.2" strokeLinecap="square"/>
            <line x1="20" y1="37" x2="20" y2="40.5" stroke="#4a9eff" strokeWidth="1.2" strokeLinecap="square"/>
            <line x1="33" y1="37" x2="33" y2="40" stroke="#4a9eff" strokeWidth="1.2" strokeLinecap="square"/>
          </svg>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', letterSpacing: '4px', color: '#f4f2ee', lineHeight: 1 }}>SUMMITSTONE</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '3px', color: '#4a9eff', marginTop: '4px', opacity: 0.8 }}>CONSTRUCTION OS · CRM</div>
        </div>

        {/* Card */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '2px', color: '#f4f2ee' }}>SIGN IN</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(244,242,238,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>Authorised personnel only</div>
          </div>

          <form onSubmit={handleLogin} style={{ padding: '20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@summitstone.com"
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', padding: '8px 12px', marginBottom: '14px', fontSize: '11px', color: '#ff4d4d' }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', height: '40px' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'rgba(244,242,238,0.25)', letterSpacing: '0.1em' }}>
          SUMMITSTONE DEVELOPMENTS · CARIBBEAN CONSTRUCTION OS
        </div>
      </div>
    </div>
  )
}
