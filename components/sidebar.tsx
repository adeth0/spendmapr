import Link from "next/link";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  Flag,
  LineChart,
  LogOut,
  WalletCards
} from "lucide-react";
import { signOut } from "@/lib/actions";

const items = [
  { href: "/dashboard" as const, label: "Dashboard", icon: WalletCards },
  { href: "/transactions" as const, label: "Transactions", icon: BarChart3 },
  { href: "/banking" as const, label: "Banking", icon: Building2 },
  { href: "/debt-tracker" as const, label: "Debt Tracker", icon: CircleDollarSign },
  { href: "/investments" as const, label: "Investments", icon: LineChart },
  { href: "/goals" as const, label: "Goals", icon: Flag }
];

export function Sidebar({ email }: { email: string }) {
  const isDemo = email === "Demo preview mode";

  return (
    <aside className="panel hidden w-full max-w-[320px] flex-col justify-between p-6 xl:max-w-[340px] lg:flex">
      <div>
        <div className="rounded-[28px] bg-slate-950 px-6 py-8 text-white shadow-soft">
          <p className="text-xs uppercase tracking-[0.26em] text-white/60">SpendMapr</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight">Personal finance, simplified.</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">{email}</p>
        </div>

        <nav className="mt-6 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-[24px] px-4 py-4 text-sm font-medium text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-950"
              >
                <Icon className="h-4 w-4 text-slate-400 transition-colors duration-300 group-hover:text-slate-700" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {isDemo ? (
        <div className="surface-muted px-4 py-4 text-center text-sm leading-6 text-slate-500">
          Add Supabase keys to enable real auth and data.
        </div>
      ) : (
        <form action={signOut}>
          <button
            type="submit"
            className="apple-button-secondary flex w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      )}
    </aside>
  );
}
