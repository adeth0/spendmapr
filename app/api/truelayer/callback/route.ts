import { NextResponse } from "next/server";
import { accessTokenExpiresAt, exchangeAuthorizationCode } from "@/lib/truelayer/oauth";
import { isTrueLayerConfigured } from "@/lib/truelayer/config";
import { syncBankConnection } from "@/lib/truelayer/sync";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const failRedirect = (message: string) =>
    NextResponse.redirect(`${origin}/banking?error=${encodeURIComponent(message)}`);

  if (oauthError) {
    return failRedirect(errorDescription ?? oauthError);
  }

  if (!isTrueLayerConfigured() || !isServiceRoleConfigured()) {
    return failRedirect("Bank linking is not configured on the server.");
  }

  if (!code || !state) {
    return failRedirect("Missing authorization response from the bank.");
  }

  const service = createServiceRoleClient();

  const { data: stateRow, error: stateError } = await service
    .from("truelayer_oauth_states")
    .select("user_id, expires_at")
    .eq("state", state)
    .maybeSingle();

  await service.from("truelayer_oauth_states").delete().eq("state", state);

  if (stateError || !stateRow) {
    return failRedirect("This sign-in link has expired. Please try Connect bank again.");
  }

  if (new Date(stateRow.expires_at as string).getTime() < Date.now()) {
    return failRedirect("This sign-in link has expired. Please try Connect bank again.");
  }

  let tokens;
  try {
    tokens = await exchangeAuthorizationCode(code);
  } catch (e) {
    return failRedirect(e instanceof Error ? e.message : "Could not exchange authorization code.");
  }

  if (!tokens.refresh_token) {
    return failRedirect("No refresh token returned. Ensure offline_access scope is enabled for your TrueLayer app.");
  }

  const userId = stateRow.user_id as string;

  const { data: connection, error: connError } = await service
    .from("bank_connections")
    .insert({ user_id: userId, status: "active" })
    .select("id")
    .single();

  if (connError || !connection) {
    return failRedirect("Could not save bank connection.");
  }

  const connectionId = connection.id as string;

  const { error: tokenError } = await service.from("bank_oauth_tokens").insert({
    connection_id: connectionId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: accessTokenExpiresAt(tokens.expires_in).toISOString()
  });

  if (tokenError) {
    await service.from("bank_connections").delete().eq("id", connectionId);
    return failRedirect("Could not store secure tokens.");
  }

  try {
    await syncBankConnection(service, connectionId);
  } catch (e) {
    console.error("TrueLayer initial sync failed:", e);
    // Connection exists; user can sync again from the UI
  }

  return NextResponse.redirect(`${origin}/banking?connected=1`);
}
