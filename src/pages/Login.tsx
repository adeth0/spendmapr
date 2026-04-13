import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, Mail, CheckCircle, ArrowRight } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.7-3.2-11.3-7.8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C41.7 35.3 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function Login() {
  const [googleLoading, setGoogleLoading]   = useState(false);
  const [email, setEmail]                   = useState('');
  const [mlLoading, setMlLoading]           = useState(false);
  const [mlSent, setMlSent]                 = useState(false);
  const { signInWithGoogle, signInWithMagicLink, error, isDemoMode } = useAuth();

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  const handleMagicLink = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMlLoading(true);
    const { error } = await signInWithMagicLink(email.trim());
    setMlLoading(false);
    if (!error) setMlSent(true);
  };

  /* ── Sent confirmation ───────────────────────────────────────────────────── */
  if (mlSent) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
        <div className="w-full max-w-sm text-center space-y-5">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(34,197,94,0.12)' }}
          >
            <CheckCircle className="h-8 w-8" style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Check your inbox</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>
              We sent a sign-in link to{' '}
              <span className="font-medium text-white">{email}</span>.
              Click the link to continue.
            </p>
          </div>
          <button
            onClick={() => { setMlSent(false); setEmail(''); }}
            className="text-sm underline underline-offset-4 transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  /* ── Main login ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-[380px]">

        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent)' }}
          >
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SpendMapr</h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-2)' }}>
            Your personal finance dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 space-y-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <h2 className="text-base font-semibold text-white text-center">Sign in to continue</h2>

          {/* Errors */}
          {error && (
            <div
              className="flex items-start gap-3 rounded-xl p-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Demo banner */}
          {isDemoMode && (
            <div
              className="flex items-start gap-3 rounded-xl p-3 text-sm"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--accent)' }}
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Demo mode — Supabase not configured. Sign-in is simulated.
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || mlLoading}
            className="flex items-center justify-center gap-3 w-full rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              height: '48px',
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text-1)',
            }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Magic link */}
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: 'var(--text-3)' }}
              />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={mlLoading || googleLoading}
                className="apple-input pl-10"
              />
            </div>
            <button
              type="submit"
              disabled={mlLoading || googleLoading || !email.trim()}
              className="apple-button-primary w-full justify-between"
            >
              <span>{mlLoading ? 'Sending link…' : 'Send sign-in link'}</span>
              {mlLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-3)' }}>
          © {new Date().getFullYear()} SpendMapr · Kavaura Labs
        </p>
      </div>
    </div>
  );
}
