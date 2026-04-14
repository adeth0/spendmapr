/**
 * truelayer-auth — generates the TrueLayer OAuth authorisation URL.
 *
 * POST (no body required) — user JWT must be in Authorization header.
 * Returns: { url: string, state: string }
 *
 * Uses the service-role admin client to verify the JWT so we are not
 * dependent on the SUPABASE_ANON_KEY format (which may be sb_publishable_).
 *
 * Env vars required:
 *   TRUELAYER_CLIENT_ID  (set via: supabase secrets set ...)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const REDIRECT_URI = 'https://spend.kavauralabs.com/banking';
const TL_AUTH_BASE = 'https://auth.truelayer-sandbox.com';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── Verify caller is an authenticated Supabase user ──────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const jwt = authHeader.replace(/^Bearer\s+/i, '');

    // Use service-role client so auth.getUser() works regardless of anon key format
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !user) {
      console.error('[truelayer-auth] getUser error:', userErr?.message);
      return json({ error: 'Unauthorized' }, 401);
    }

    // ── Build TrueLayer auth URL ──────────────────────────────────────────────
    const state    = crypto.randomUUID();
    const clientId = Deno.env.get('TRUELAYER_CLIENT_ID');
    if (!clientId) return json({ error: 'TRUELAYER_CLIENT_ID not configured' }, 500);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     clientId,
      redirect_uri:  REDIRECT_URI,
      scope:         'accounts balance transactions',
      providers:     'mock monzo',
      state,
    });

    return json({ url: `${TL_AUTH_BASE}/?${params.toString()}`, state });

  } catch (err) {
    console.error('[truelayer-auth]', err);
    return json({ error: 'Internal server error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
