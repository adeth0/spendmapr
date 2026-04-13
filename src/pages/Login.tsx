import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

// Google SVG logo
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

// Microsoft SVG logo
function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const { signInWithGoogle, signInWithMicrosoft, error, isDemoMode } = useAuth();

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
    // If demo mode, the user is set synchronously; otherwise the page redirects.
    // Only clear loading if still mounted (demo mode won't unmount via redirect).
    setGoogleLoading(false);
  };

  const handleMicrosoft = async () => {
    setMicrosoftLoading(true);
    await signInWithMicrosoft();
    setMicrosoftLoading(false);
  };

  const anyLoading = googleLoading || microsoftLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">SpendMapr</h1>
          <p className="mt-2 text-slate-500 text-sm">Your personal finance dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 text-center">Sign in to continue</h2>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Demo mode banner */}
          {isDemoMode && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Demo mode — Supabase is not configured. Sign in is simulated.</span>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={anyLoading}
            className="flex items-center justify-center gap-3 w-full h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </button>

          {/* Microsoft */}
          <button
            type="button"
            onClick={handleMicrosoft}
            disabled={anyLoading}
            className="flex items-center justify-center gap-3 w-full h-12 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {microsoftLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MicrosoftIcon />
            )}
            {microsoftLoading ? 'Connecting…' : 'Continue with Microsoft'}
          </button>
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
