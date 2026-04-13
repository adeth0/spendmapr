import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle, Mail, CheckCircle } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.7-3.2-11.3-7.8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C41.7 35.3 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { signInWithGoogle, signInWithMagicLink, error, isDemoMode } = useAuth();

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    setGoogleLoading(false);
  };

  const handleMagicLink = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim()) return;
    setMagicLinkLoading(true);
    const { error } = await signInWithMagicLink(email.trim());
    setMagicLinkLoading(false);
    if (!error) setMagicLinkSent(true);
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Check your email</h2>
          <p className="text-slate-500 text-sm">
            We sent a sign-in link to <span className="font-medium text-slate-700">{email}</span>.
            Click the link in your email to continue.
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setEmail(''); }}
            className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">SpendMapr</h1>
          <p className="mt-2 text-slate-500 text-sm">Your personal finance dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
          <h2 className="text-lg font-semibold text-slate-800 text-center">Sign in to continue</h2>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Demo banner */}
          {isDemoMode && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Demo mode — Supabase not configured. Sign in is simulated.</span>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || magicLinkLoading}
            className="flex items-center justify-center gap-3 w-full h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or sign in with email</span>
            </div>
          </div>

          {/* Magic link */}
          <form onSubmit={handleMagicLink} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={magicLinkLoading || googleLoading}
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={magicLinkLoading || googleLoading || !email.trim()}
              className="flex items-center justify-center gap-2 w-full h-12 px-4 rounded-xl bg-slate-900 hover:bg-slate-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {magicLinkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {magicLinkLoading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
        <p className="text-center text-xs text-slate-400 mt-1">
          © {new Date().getFullYear()} SpendMapr · Kavaura Labs
        </p>
      </div>
    </div>
  );
}
