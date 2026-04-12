import { redirect } from "next/navigation";
import { createServerClient, isDemoMode } from "@/lib/supabase/server";

export default async function HomePage() {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  redirect(user ? "/dashboard" : "/login");
}
