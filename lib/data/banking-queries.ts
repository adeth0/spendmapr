import { createServerClient } from "@/lib/supabase/server";

export type BankConnectionRow = {
  id: string;
  user_id: string;
  provider_id: string | null;
  status: string;
  created_at: string;
  last_sync_at: string | null;
};

export type BankAccountRow = {
  id: string;
  user_id: string;
  connection_id: string;
  truelayer_account_id: string;
  display_name: string | null;
  account_type: string | null;
  currency: string | null;
  current_balance: number | null;
  available_balance: number | null;
  updated_at: string;
};

export type BankTransactionRow = {
  id: string;
  user_id: string;
  account_id: string;
  truelayer_transaction_id: string;
  amount: number;
  currency: string | null;
  description: string | null;
  booking_date: string;
  created_at: string;
};

export async function getBankingDataForUser() {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, connections: [], accounts: [], transactions: [] };
  }

  const [connectionsRes, accountsRes, txRes] = await Promise.all([
    supabase.from("bank_connections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("bank_accounts").select("*").eq("user_id", user.id).order("display_name", { ascending: true }),
    supabase
      .from("bank_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(40)
  ]);

  return {
    user,
    connections: (connectionsRes.data ?? []) as BankConnectionRow[],
    accounts: (accountsRes.data ?? []) as BankAccountRow[],
    transactions: (txRes.data ?? []) as BankTransactionRow[]
  };
}
