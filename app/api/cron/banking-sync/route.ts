import { NextResponse } from "next/server";
import { syncBankConnection } from "@/lib/truelayer/sync";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";

/**
 * Daily Open Banking sync. Protect with a secret header.
 * Example Vercel Cron: hit this route once per day with Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron") === "1";

  if (secret) {
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (!vercelCron) {
    return NextResponse.json(
      { error: "Set CRON_SECRET or invoke from Vercel Cron (x-vercel-cron)." },
      { status: 401 }
    );
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json({ error: "Service role not configured." }, { status: 503 });
  }

  const service = createServiceRoleClient();
  const { data: connections, error } = await service
    .from("bank_connections")
    .select("id")
    .eq("status", "active");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; message?: string }[] = [];

  for (const row of connections ?? []) {
    const id = row.id as string;
    try {
      await syncBankConnection(service, id);
      results.push({ id, ok: true });
    } catch (e) {
      results.push({
        id,
        ok: false,
        message: e instanceof Error ? e.message : "error"
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
