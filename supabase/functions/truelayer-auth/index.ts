/**
 * truelayer-auth — generates the TrueLayer OAuth authorisation URL.
 *
 * POST (no body required) — user JWT must be in Authorization header.
 * Returns: { url: string, state: string }
 *
 * The state is a random UUID used for CSRF protection.
 * The frontend stores it in sessionStorage and verifies it on callback.
 *
 * Env vars required:
 *   TRUELAYER_CLIENT_ID  (set via: supabase secrets set ...)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  'https://spend.kavauralabs.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const REDIRECT_URI = 'https://spend.kavauralabs.com/banking';
const TL_AUTH_BASE = 'https://auth.truelayer-sandbox.com';

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── Verify caller is an authenticated Supabase user ──────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // ── Build TrueLayer auth URL ──────────────────────────────────────────────
    const state  = crypto.randomUUID();
    const clientId = Deno.env.get('TRUELAYER_CLIENT_ID');
    if (!clientId) {
      return json({ error: 'TRUELAYER_CLIENT_ID not configured' }, 500);
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     clientId,
      redirect_uri:  REDIRECT_URI,
      scope:         'accounts balance transactions',
      // 'mock' allows sandbox testing with pre-populated data.
      // Remove 'mock' and keep only 'monzo' when going to production.
      providers:     'mock monzo',
      state,
    });

    const url = `${TL_AUTH_BASE}/?${params.toString()}`;
    return json({ url, state });

  } catch (err) {
    console.error('[truelayer-auth]', err);
    return json({ error: 'Internal server error' }, 500);
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
