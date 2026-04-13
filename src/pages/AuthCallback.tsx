import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) { setError(error.message); return; }
      if (session) { navigate('/dashboard', { replace: true }); return; }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          navigate('/dashboard', { replace: true });
        } else if (event === 'SIGNED_OUT') {
          subscription.unsubscribe();
          navigate('/login', { replace: true });
        }
      });

      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login', { replace: true });
      }, 10_000);

      return () => { clearTimeout(timeout); subscription.unsubscribe(); };
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
        <div className="text-center space-y-5 max-w-sm">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(239,68,68,0.1)' }}
          >
            <AlertCircle className="h-7 w-7" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Authentication failed</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-2)' }}>{error}</p>
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="apple-button-secondary"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="text-center space-y-4">
        <div className="spinner mx-auto" />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Completing sign in…</p>
      </div>
    </div>
  );
}
