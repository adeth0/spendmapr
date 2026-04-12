import {
  getTrueLayerApiBase,
  getTrueLayerAuthBase,
  getTrueLayerClientId,
  getTrueLayerClientSecret,
  getTrueLayerRedirectUri
} from "@/lib/truelayer/config";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token?: string;
  scope?: string;
};

async function postToken(body: Record<string, string>) {
  const authBase = getTrueLayerAuthBase();
  const response = await fetch(`${authBase}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = (await response.json()) as TokenResponse & { error?: string; error_description?: string };

  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? "TrueLayer token request failed.");
  }

  return data;
}

export async function exchangeAuthorizationCode(code: string) {
  return postToken({
    grant_type: "authorization_code",
    client_id: getTrueLayerClientId(),
    client_secret: getTrueLayerClientSecret(),
    code,
    redirect_uri: getTrueLayerRedirectUri()
  });
}

export async function refreshAccessToken(refreshToken: string) {
  return postToken({
    grant_type: "refresh_token",
    client_id: getTrueLayerClientId(),
    client_secret: getTrueLayerClientSecret(),
    refresh_token: refreshToken
  });
}

export function accessTokenExpiresAt(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000 - 60_000);
}

export async function dataApiFetch<T>(path: string, accessToken: string) {
  const base = getTrueLayerApiBase().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = (await response.json()) as T & {
    error?: string;
    error_description?: string;
    results?: unknown;
  };

  if (!response.ok) {
    throw new Error(
      data.error_description ?? data.error ?? `TrueLayer API error (${response.status}).`
    );
  }

  return data;
}
