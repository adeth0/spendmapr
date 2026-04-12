import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/server";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { syncBankConnection } from "@/lib/truelayer/sync";

export async function POST(request: Request) {
  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured." }, { status: 503 });
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let connectionId: string | undefined;
  try {
    const body = (await request.json()) as { connectionId?: string };
    connectionId = body.connectionId;
  } catch {
    connectionId = undefined;
  }

  const service = createServiceRoleClient();

  if (connectionId) {
    const { data: owned } = await supabase
      .from("bank_connections")
      .select("id")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json({ error: "Connection not found." }, { status: 404 });
    }

    try {
      await syncBankConnection(service, connectionId);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Sync failed." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, synced: [connectionId] });
  }

  const { data: connections } = await supabase
    .from("bank_connections")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const ids = (connections ?? []).map((c) => c.id as string);
  const synced: string[] = [];
  const errors: string[] = [];

  for (const id of ids) {
    try {
      await syncBankConnection(service, id);
      synced.push(id);
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "Unknown error");
    }
  }

  return NextResponse.json({ ok: errors.length === 0, synced, errors });
}
