import { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { DemoSetupPanel } from "@/components/demo-setup-panel";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { createServerClient, isDemoMode } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";

type AppShellProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export async function AppShell({ title, description, children }: AppShellProps) {
  if (isDemoMode()) {
    return (
      <main className="bg-[#F7F8FA]">
        <PageContainer className="lg:flex-row">
          <Sidebar email="Demo preview mode" />

          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <Card className="hidden items-center justify-between px-8 py-8 lg:flex">
              <div>
                <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">{description}</p>
              </div>
              <div className="surface-muted rounded-[24px] px-5 py-3.5 text-sm text-brand-600">
                Demo mode
              </div>
            </Card>

            <Card className="space-y-3 px-6 py-6 lg:hidden">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
            </Card>

            <DemoSetupPanel />
            <div className="flex flex-1 flex-col gap-6">{children}</div>
            <MobileNav />
          </div>
        </PageContainer>
      </main>
    );
  }

  const supabase = await createServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="bg-[#F7F8FA]">
      <PageContainer className="lg:flex-row">
        <Sidebar email={user.email ?? "Signed in"} />

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <Card className="hidden items-center justify-between px-8 py-8 lg:flex">
            <div>
              <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">{description}</p>
            </div>
            <div className="surface-muted rounded-[24px] px-5 py-3.5 text-sm text-slate-500">
              Welcome back
            </div>
          </Card>

          <Card className="space-y-3 px-6 py-6 lg:hidden">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          </Card>

          <div className="flex flex-1 flex-col gap-8">{children}</div>
          <MobileNav />
        </div>
      </PageContainer>
    </main>
  );
}
