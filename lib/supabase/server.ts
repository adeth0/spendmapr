import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";

function isConfiguredValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  return !value.includes("your-");
}

function getPublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function isDemoMode() {
  return (
    !isConfiguredValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    !isConfiguredValue(getPublicKey())
  );
}

export function getSupabaseSetupState() {
  return {
    hasAppUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    hasSupabaseUrl: isConfiguredValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: isConfiguredValue(getPublicKey())
  };
}

function getSupabaseKeys(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getPublicKey();

  if (!isConfiguredValue(url) || !isConfiguredValue(anonKey)) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url: url as string, anonKey: anonKey as string };
}

export async function createServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseKeys();

  return createSupabaseServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}

export async function createRouteHandlerClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseKeys();

  return createSupabaseServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}
