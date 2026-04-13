import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Exchange the PKCE code for a session. Supabase detects the ?code= param
    // automatically when detectSessionInUrl=true and getSession() is called.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      if (session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      // No session yet — listen for the SIGNED_IN event from the code exchange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          navigate('/dashboard', { replace: true });
        } else if (event === 'SIGNED_OUT') {
          subscription.unsubscribe();
          navigate('/login', { replace: true });
        }
      });

      // Safety timeout — if no auth event after 10s, redirect to login
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login', { replace: true });
      }, 10_000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Authentication failed</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-sm font-medium text-slate-900 underline underline-offset-4"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto" />
        <p className="text-sm text-slate-500">Completing sign in…</p>
      </div>
    </div>
  );
}
