/**
 * truelayer-data — fetches accounts, balances, and the last 90 days of
 * transactions from TrueLayer and upserts them into Supabase.
 *
 * POST (no body required)
 * Authorization: Bearer <supabase-jwt>
 *
 * Returns: { success: true, accounts: number, transactions: number }
 *
 * Handles token refresh automatically when the stored access_token is
 * within 60 seconds of expiry.
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

const TL_API   = 'https://api.truelayer-sandbox.com';
const TL_AUTH  = 'https://auth.truelayer-sandbox.com';

// ── TrueLayer API helpers ─────────────────────────────────────────────────────

async function tlGet(path: string, accessToken: string): Promise<unknown> {
  const res = await fetch(`${TL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) throw new Error('TOKEN_EXPIRED');

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TrueLayer API ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json();
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(`${TL_AUTH}/connect/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${detail}`);
  }

  return res.json();
}

// ── Main handler ──────────────────────────────────────────────────────────────

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

    const clientId     = Deno.env.get('TRUELAYER_CLIENT_ID')!;
    const clientSecret = Deno.env.get('TRUELAYER_CLIENT_SECRET')!;

    // ── Retrieve stored tokens ────────────────────────────────────────────────
    const { data: conn, error: connErr } = await admin
      .from('truelayer_connections')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (connErr || !conn) {
      return json({ error: 'No TrueLayer connection found. Connect your bank first.' }, 404);
    }

    // ── Refresh if expiring within 60 seconds ─────────────────────────────────
    let accessToken: string = conn.access_token;
    const expiresAt = new Date(conn.expires_at);

    if (expiresAt <= new Date(Date.now() + 60_000)) {
      console.log('[truelayer-data] refreshing expired token for user', user.id);
      try {
        const refreshed = await refreshAccessToken(conn.refresh_token, clientId, clientSecret);
        accessToken = refreshed.access_token;

        await admin
          .from('truelayer_connections')
          .update({
            access_token:  refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? conn.refresh_token,
            expires_at:    new Date(Date.now() + refreshed.expires_in * 1_000).toISOString(),
            updated_at:    new Date().toISOString(),
          })
          .eq('user_id', user.id);
      } catch (refreshErr) {
        console.error('[truelayer-data] token refresh failed:', refreshErr);
        return json({ error: 'Token expired and refresh failed. Please reconnect your bank.' }, 401);
      }
    }

    // ── Fetch accounts ────────────────────────────────────────────────────────
    let accounts: TLAccount[] = [];
    try {
      const accountsResp = await tlGet('/data/v1/accounts', accessToken) as { results: TLAccount[] };
      accounts = accountsResp.results ?? [];
    } catch (err) {
      if ((err as Error).message === 'TOKEN_EXPIRED') {
        return json({ error: 'Access token expired. Please reconnect your bank.' }, 401);
      }
      throw err;
    }

    // Date range: last 90 days
    const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1_000).toISOString().split('T')[0];
    const toDate   = new Date().toISOString().split('T')[0];

    let totalTransactions = 0;

    for (const acc of accounts) {
      // ── Fetch balance (non-fatal if unavailable) ──────────────────────────
      let balance: number | null = null;
      try {
        const balResp = await tlGet(
          `/data/v1/accounts/${acc.account_id}/balance`,
          accessToken,
        ) as { results: TLBalance[] };
        balance = balResp.results?.[0]?.current ?? null;
      } catch (e) {
        console.warn('[truelayer-data] balance fetch failed for', acc.account_id, e);
      }

      // ── Upsert bank_account ───────────────────────────────────────────────
      const { data: bankRow, error: bankErr } = await admin
        .from('bank_accounts')
        .upsert(
          {
            user_id:               user.id,
            truelayer_account_id:  acc.account_id,
            display_name:          acc.display_name,
            account_type:          acc.account_type,
            account_number:        acc.account_number ?? null,
            currency:              acc.currency ?? 'GBP',
            balance:               balance,
            balance_updated_at:    balance !== null ? new Date().toISOString() : null,
            provider_id:           acc.provider?.provider_id ?? null,
            provider_display_name: acc.provider?.display_name ?? null,
            updated_at:            new Date().toISOString(),
          },
          { onConflict: 'user_id,truelayer_account_id' },
        )
        .select('id')
        .single();

      if (bankErr || !bankRow) {
        console.error('[truelayer-data] bank_account upsert failed:', bankErr);
        continue;
      }

      // ── Fetch transactions ────────────────────────────────────────────────
      let txns: TLTransaction[] = [];
      try {
        const txnResp = await tlGet(
          `/data/v1/accounts/${acc.account_id}/transactions?from=${fromDate}&to=${toDate}`,
          accessToken,
        ) as { results: TLTransaction[] };
        txns = txnResp.results ?? [];
      } catch (e) {
        console.warn('[truelayer-data] txn fetch failed for', acc.account_id, e);
        continue;
      }

      if (txns.length === 0) continue;

      // ── Upsert transactions (deduplicated by truelayer_transaction_id) ────
      const rows = txns.map(t => ({
        user_id:                  user.id,
        account_id:               bankRow.id,
        truelayer_transaction_id: t.transaction_id,
        amount:                   t.amount,
        currency:                 t.currency ?? 'GBP',
        description:              t.description ?? null,
        merchant_name:            t.merchant_name ?? null,
        category:                 t.transaction_classification?.[0] ?? null,
        transaction_type:         t.transaction_type ?? null,
        transaction_at:           t.timestamp,
        running_balance:          t.running_balance?.amount ?? null,
      }));

      const { error: txnErr } = await admin
        .from('transactions')
        .upsert(rows, { onConflict: 'user_id,truelayer_transaction_id' });

      if (txnErr) {
        console.error('[truelayer-data] transactions upsert error:', txnErr);
      } else {
        totalTransactions += rows.length;
      }
    }

    return json({ success: true, accounts: accounts.length, transactions: totalTransactions });

  } catch (err) {
    console.error('[truelayer-data]', err);
    const isExpired = (err as Error).message === 'TOKEN_EXPIRED';
    return json({ error: (err as Error).message }, isExpired ? 401 : 500);
  }
});

// ── TrueLayer response types ──────────────────────────────────────────────────

interface TLAccount {
  account_id:     string;
  account_type:   string;
  display_name:   string;
  currency:       string;
  account_number: Record<string, string> | null;
  provider:       { provider_id: string; display_name: string } | null;
}

interface TLBalance {
  current:   number;
  available: number;
  currency:  string;
}

interface TLTransaction {
  transaction_id:              string;
  timestamp:                   string;
  description:                 string;
  amount:                      number;
  currency:                    string;
  transaction_type:            string;
  transaction_classification:  string[];
  merchant_name:               string | null;
  running_balance:             { amount: number; currency: string } | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
