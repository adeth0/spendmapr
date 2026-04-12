"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { inferTransactionCategory } from "@/lib/budgeting";
import { formatCurrency } from "@/lib/utils";
import { createServerClient, isDemoMode } from "@/lib/supabase/server";

type FormState = {
  message: string;
};

async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  return { supabase, user };
}

export async function signInWithEmail(_: FormState, formData: FormData): Promise<FormState> {
  if (isDemoMode()) {
    return { message: "Demo mode is active. Add Supabase keys to enable email sign-in." };
  }

  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { message: "Please enter your email address." };
  }

  const supabase = await createServerClient();
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    (await headers()).get("origin") ??
    "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    return { message: error.message };
  }

  return { message: "Check your inbox for your secure sign-in link." };
}

export async function signOut() {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createTransaction(_: FormState, formData: FormData): Promise<FormState> {
  if (isDemoMode()) {
    return { message: "Demo mode only. Add Supabase keys to save real transactions." };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const payload = {
      user_id: user.id,
      title: String(formData.get("title") ?? "").trim(),
      type: String(formData.get("type") ?? "expense"),
      amount: Number(formData.get("amount") ?? 0),
      category: inferTransactionCategory({
        title: String(formData.get("title") ?? "").trim(),
        type: String(formData.get("type") ?? "expense") as "income" | "expense",
        notes: String(formData.get("notes") ?? "").trim() || null,
        category: String(formData.get("category") ?? "").trim()
      }),
      transaction_date: String(formData.get("transactionDate") ?? ""),
      notes: String(formData.get("notes") ?? "").trim() || null
    };

    const { error } = await supabase.from("transactions").insert(payload);

    if (error) {
      return { message: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { message: "Transaction saved." };
  } catch {
    return { message: "Please sign in to add transactions." };
  }
}

export async function deleteTransaction(formData: FormData) {
  if (isDemoMode()) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  const id = String(formData.get("id") ?? "");

  await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function updateTransaction(_: FormState, formData: FormData): Promise<FormState> {
  if (isDemoMode()) {
    return { message: "Demo mode only. Add Supabase keys to edit real transactions." };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const id = String(formData.get("id") ?? "");
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      type: String(formData.get("type") ?? "expense"),
      amount: Number(formData.get("amount") ?? 0),
      category: inferTransactionCategory({
        title: String(formData.get("title") ?? "").trim(),
        type: String(formData.get("type") ?? "expense") as "income" | "expense",
        notes: String(formData.get("notes") ?? "").trim() || null,
        category: String(formData.get("category") ?? "").trim()
      }),
      transaction_date: String(formData.get("transactionDate") ?? ""),
      notes: String(formData.get("notes") ?? "").trim() || null
    };

    const { error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { message: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/transactions");
    return { message: "Transaction updated." };
  } catch {
    return { message: "Please sign in to edit transactions." };
  }
}

export async function createDebt(_: FormState, formData: FormData): Promise<FormState> {
  if (isDemoMode()) {
    return { message: "Demo mode only. Add Supabase keys to save real debts." };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const payload = {
      user_id: user.id,
      name: String(formData.get("name") ?? "").trim(),
      provider: String(formData.get("provider") ?? "").trim() || null,
      original_amount: Number(formData.get("originalAmount") ?? 0),
      current_balance: Number(formData.get("currentBalance") ?? 0),
      minimum_payment: Number(formData.get("minimumPayment") ?? 0),
      apr: Number(formData.get("apr") ?? 0),
      acquired_at: String(formData.get("acquiredAt") ?? new Date().toISOString().slice(0, 10))
    };

    const { error } = await supabase.from("debts").insert(payload);

    if (error) {
      return { message: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/debt-tracker");
    return { message: "Debt added." };
  } catch {
    return { message: "Please sign in to manage debts." };
  }
}

export async function deleteDebt(formData: FormData) {
  if (isDemoMode()) {
    return;
  }

  const { supabase, user } = await getAuthenticatedUser();
  const id = String(formData.get("id") ?? "");

  await supabase.from("debts").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/debt-tracker");
}

function monthsBetween(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

function roundTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export async function updateDebt(_: FormState, formData: FormData): Promise<FormState> {
  if (isDemoMode()) {
    return { message: "Demo mode only. Add Supabase keys to update debts." };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const id = String(formData.get("id") ?? "");

    const { data: debtData, error: fetchError } = await supabase
      .from("debts")
      .select("id, current_balance, minimum_payment, apr, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !debtData) {
      return { message: fetchError?.message ?? "Debt not found." };
    }

    const balance = Number(debtData.current_balance ?? 0);
    const monthlyPayment = Number(debtData.minimum_payment ?? 0);
    const apr = Number(debtData.apr ?? 0);
    const referenceDate = debtData.updated_at || debtData.created_at;
    const months = monthsBetween(referenceDate, new Date().toISOString());

    if (months <= 0) {
      return { message: "No new payment period has passed since the last update." };
    }

    if (monthlyPayment <= 0) {
      return { message: "Minimum payment must be greater than 0 to update the balance." };
    }

    const monthlyRate = apr / 100 / 12;
    let remaining = balance;
    let totalInterest = 0;
    let periods = 0;

    for (let i = 0; i < months && remaining > 0.01; i += 1) {
      const interest = roundTwo(remaining * monthlyRate);
      const principal = roundTwo(monthlyPayment - interest);
      if (principal <= 0) {
        return { message: "This payment is too low to cover accrued interest at the current APR." };
      }
      remaining = roundTwo(Math.max(remaining - principal, 0));
      totalInterest = roundTwo(totalInterest + interest);
      periods += 1;
    }

    const { error: updateError } = await supabase
      .from("debts")
      .update({ current_balance: remaining, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return { message: updateError.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/debt-tracker");

    return {
      message: `Updated ${periods} month${periods === 1 ? "" : "s"}; accrued interest ${formatCurrency(totalInterest)}.`
    };
  } catch {
    return { message: "Please sign in to manage debts." };
  }
}

function isSchemaCacheMissingTableError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.includes("Could not find the table 'public.goals' in the schema cache")
  );
}

export async function createGoal(_: FormState, formData: FormData): Promise<FormState> {
  if (isDemoMode()) {
    return { message: "Demo mode only. Add Supabase keys to save real goals." };
  }

  try {
    const { supabase, user } = await getAuthenticatedUser();
    const payload = {
      user_id: user.id,
      name: String(formData.get("name") ?? "").trim(),
      goal_type: String(formData.get("goalType") ?? "ISA").trim(),
      target_amount: Number(formData.get("targetAmount") ?? 0),
      current_amount: Number(formData.get("currentAmount") ?? 0),
      monthly_contribution: Number(formData.get("monthlyContribution") ?? 0)
    };

    const { error } = await supabase.from("goals").insert(payload);

    if (error) {
      return { message: error.message };
    }

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    return { message: "Goal created." };
  } catch (error) {
    if (isSchemaCacheMissingTableError(error)) {
      return {
        message:
          "Could not save goal because the goals table is missing. Run supabase/schema.sql in your Supabase SQL editor to create the goals table."
      };
    }

    return { message: "Please sign in to manage goals." };
  }
}

export async function deleteGoal(_: FormState, formData: FormData): Promise<FormState> {
  if (isDemoMode()) {
    return { message: "Demo mode only. Add Supabase keys to delete goals." };
  }

  const { supabase, user } = await getAuthenticatedUser();
  const id = String(formData.get("id") ?? "");

  await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  return { message: "Goal deleted." };
}
