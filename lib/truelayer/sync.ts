import type { SupabaseClient } from "@supabase/supabase-js";
import { accessTokenExpiresAt, dataApiFetch, refreshAccessToken } from "@/lib/truelayer/oauth";

type ResultsWrapper = { results?: unknown[] };

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function transactionDescription(row: Record<string, unknown>): string {
  const merchant = asObject(row.merchant_name);
  const meta = asObject(row.meta);
  return (
    pickString(row.description) ??
    pickString(merchant?.name) ??
    pickString(meta?.provider_description) ??
    "Bank transaction"
  );
}

export async function ensureFreshAccessToken(
  service: SupabaseClient,
  connectionId: string
): Promise<string> {
  const { data: row, error } = await service.from("bank_oauth_tokens").select("*").eq("connection_id", connectionId).maybeSingle();

  if (error || !row) {
    throw new Error("No OAuth tokens for this connection.");
  }

  const expiresAt = new Date(row.expires_at as string);
  if (expiresAt.getTime() > Date.now() + 30_000) {
    return row.access_token as string;
  }

  const refreshed = await refreshAccessToken(row.refresh_token as string);
  const nextRefresh = refreshed.refresh_token ?? (row.refresh_token as string);
  const expires = accessTokenExpiresAt(refreshed.expires_in);

  await service
    .from("bank_oauth_tokens")
    .update({
      access_token: refreshed.access_token,
      refresh_token: nextRefresh,
      expires_at: expires.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("connection_id", connectionId);

  return refreshed.access_token;
}

export async function syncBankConnection(service: SupabaseClient, connectionId: string) {
  const { data: connection, error: connError } = await service
    .from("bank_connections")
    .select("id, user_id")
    .eq("id", connectionId)
    .maybeSingle();

  if (connError || !connection) {
    throw new Error("Connection not found.");
  }

  const userId = connection.user_id as string;
  const accessToken = await ensureFreshAccessToken(service, connectionId);

  const accountsPayload = await dataApiFetch<ResultsWrapper>("/accounts", accessToken);
  const rawAccounts = Array.isArray(accountsPayload.results) ? accountsPayload.results : [];

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 90);
  const fromStr = fromDate.toISOString().slice(0, 10);
  const toStr = new Date().toISOString().slice(0, 10);

  for (const raw of rawAccounts) {
    const acc = asObject(raw);
    if (!acc) {
      continue;
    }

    const tlAccountId = pickString(acc.account_id);
    if (!tlAccountId) {
      continue;
    }

    const displayName = pickString(acc.display_name) ?? pickString(acc.account_name) ?? "Account";
    const accountType = pickString(acc.account_type);
    const currency = pickString(acc.currency) ?? "GBP";

    const { data: upserted, error: upsertErr } = await service
      .from("bank_accounts")
      .upsert(
        {
          user_id: userId,
          connection_id: connectionId,
          truelayer_account_id: tlAccountId,
          display_name: displayName,
          account_type: accountType,
          currency,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,truelayer_account_id" }
      )
      .select("id")
      .maybeSingle();

    if (upsertErr) {
      await service.from("bank_connections").update({ status: "error" }).eq("id", connectionId);
      throw new Error(upsertErr.message);
    }

    const internalAccountId = upserted?.id as string | undefined;
    if (!internalAccountId) {
      continue;
    }

    try {
      const balancePayload = await dataApiFetch<ResultsWrapper>(
        `/accounts/${tlAccountId}/balance`,
        accessToken
      );
      const balResults = Array.isArray(balancePayload.results) ? balancePayload.results : [];
      const firstBal = asObject(balResults[0]);
      if (firstBal) {
        const current = pickNumber(firstBal.current) ?? pickNumber(asObject(firstBal.balance)?.available);
        const available = pickNumber(firstBal.available) ?? pickNumber(firstBal.current);
        await service
          .from("bank_accounts")
          .update({
            current_balance: current,
            available_balance: available ?? current,
            updated_at: new Date().toISOString()
          })
          .eq("id", internalAccountId);
      }
    } catch {
      // Some providers omit balance; continue
    }

    const txPayload = await dataApiFetch<ResultsWrapper>(
      `/accounts/${tlAccountId}/transactions?from=${fromStr}&to=${toStr}`,
      accessToken
    );
    const txResults = Array.isArray(txPayload.results) ? txPayload.results : [];

    for (const txRaw of txResults) {
      const tx = asObject(txRaw);
      if (!tx) {
        continue;
      }
      const txId = pickString(tx.transaction_id);
      if (!txId) {
        continue;
      }
      const amount = pickNumber(tx.amount);
      if (amount === null) {
        continue;
      }
      const ts = pickString(tx.timestamp) ?? pickString(tx.value_date);
      const bookingDate = ts ? ts.slice(0, 10) : toStr;

      await service.from("bank_transactions").upsert(
        {
          user_id: userId,
          account_id: internalAccountId,
          truelayer_transaction_id: txId,
          amount,
          currency: pickString(tx.currency) ?? currency,
          description: transactionDescription(tx),
          booking_date: bookingDate
        },
        { onConflict: "user_id,truelayer_transaction_id" }
      );
    }
  }

  await service
    .from("bank_connections")
    .update({ last_sync_at: new Date().toISOString(), status: "active" })
    .eq("id", connectionId);
}
