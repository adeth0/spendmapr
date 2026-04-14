/**
 * truelayer-token — exchanges a TrueLayer authorisation code for access/refresh tokens
 * and stores them in the truelayer_connections table.
 *
 * POST { code: string }
 * Authorization: Bearer <supabase-jwt>
 *
 * The client secret NEVER reaches the browser — it lives only in this function's
 * environment variables (set via `supabase secrets set TRUELAYER_CLIENT_SECRET=...`).
 *
 * Env vars required:
 *   TRUELAYER_CLIENT_ID
 *   TRUELAYER_CLIENT_SECRET
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const REDIRECT_URI  = 'https://spend.kavauralabs.com/banking';
const TL_TOKEN_URL  = 'https://auth.truelayer-sandbox.com/connect/token';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const jwt = authHeader.replace(/^Bearer\s+/i, '');

    // Use service-role client so auth.getUser() works regardless of anon key format
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: { user }, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    // ── Validate body ─────────────────────────────────────────────────────────
    let code: string;
    try {
      const body = await req.json();
      code = body?.code;
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    if (!code) return json({ error: 'Missing code in request body' }, 400);

    // ── Exchange code for tokens (secret stays server-side) ───────────────────
    const clientId     = Deno.env.get('TRUELAYER_CLIENT_ID');
    const clientSecret = Deno.env.get('TRUELAYER_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      return json({ error: 'TrueLayer credentials not configured' }, 500);
    }

    const tokenRes = await fetch(TL_TOKEN_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     clientId,
        client_secret: clientSecret,
        code,
        redirect_uri:  REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error('[truelayer-token] exchange failed:', tokenRes.status, detail);
      return json({
        error:  'Token exchange failed',
        detail: tokenRes.status === 400 ? 'Invalid or expired auth code' : detail,
      }, 400);
    }

    const tokens = await tokenRes.json() as {
      access_token:  string;
      refresh_token: string;
      expires_in:    number;
      scope?:        string;
    };

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1_000).toISOString();

    // ── Persist tokens using service role (bypasses RLS) ─────────────────────
    const { error: upsertErr } = await admin
      .from('truelayer_connections')
      .upsert(
        {
          user_id:       user.id,
          access_token:  tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at:    expiresAt,
          scope:         tokens.scope ?? null,
          updated_at:    new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (upsertErr) {
      console.error('[truelayer-token] upsert error:', upsertErr);
      return json({ error: 'Failed to store tokens' }, 500);
    }

    return json({ success: true });

  } catch (err) {
    console.error('[truelayer-token]', err);
    return json({ error: 'Internal server error' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
