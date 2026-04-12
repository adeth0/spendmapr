export function isTrueLayerConfigured() {
  const clientId = process.env.TRUELAYER_CLIENT_ID;
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET;
  const redirectUri = process.env.TRUELAYER_REDIRECT_URI;
  return Boolean(
    clientId &&
      clientSecret &&
      redirectUri &&
      !clientId.includes("your-") &&
      !clientSecret.includes("your-")
  );
}

export function getTrueLayerAuthBase() {
  return process.env.TRUELAYER_AUTH_BASE ?? "https://auth.truelayer.com";
}

export function getTrueLayerApiBase() {
  return process.env.TRUELAYER_API_BASE ?? "https://api.truelayer.com/data/v1";
}

export function getTrueLayerRedirectUri() {
  return process.env.TRUELAYER_REDIRECT_URI ?? "";
}

export function getTrueLayerClientId() {
  return process.env.TRUELAYER_CLIENT_ID ?? "";
}

export function getTrueLayerClientSecret() {
  return process.env.TRUELAYER_CLIENT_SECRET ?? "";
}

/** Scopes for AIS: accounts, balances, transactions + refresh token */
export const TRUELAYER_DATA_SCOPES =
  "info accounts balance transactions offline_access";

export function buildAuthLink(params: { state: string; userEmail?: string | null }) {
  const clientId = getTrueLayerClientId();
  const redirectUri = getTrueLayerRedirectUri();
  const base = getTrueLayerAuthBase();
  const search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: TRUELAYER_DATA_SCOPES,
    state: params.state,
    providers: "uk-ob-all",
    country_id: "GB"
  });
  if (params.userEmail) {
    search.set("user_email", params.userEmail);
  }
  return `${base}/?${search.toString()}`;
}
