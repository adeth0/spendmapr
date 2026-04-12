import { NextResponse } from "next/server";
import { buildAuthLink, isTrueLayerConfigured } from "@/lib/truelayer/config";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  if (!isTrueLayerConfigured()) {
    return NextResponse.json(
      { error: "TrueLayer is not configured. Set TRUELAYER_CLIENT_ID, TRUELAYER_CLIENT_SECRET, TRUELAYER_REDIRECT_URI." },
      { status: 503 }
    );
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY is required to complete bank linking." },
      { status: 503 }
    );
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const service = createServiceRoleClient();
  const state = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const { error } = await service.from("truelayer_oauth_states").insert({
    state,
    user_id: user.id,
    expires_at: expiresAt.toISOString()
  });

  if (error) {
    return NextResponse.json({ error: "Could not start bank connection." }, { status: 500 });
  }

  const authUrl = buildAuthLink({ state, userEmail: user.email });
  return NextResponse.redirect(authUrl);
}
