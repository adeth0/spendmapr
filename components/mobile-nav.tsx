import Link from "next/link";
import { Building2, CircleDollarSign, Flag, LayoutGrid, LineChart, ReceiptText } from "lucide-react";

const items = [
  { href: "/dashboard" as const, label: "Home", icon: LayoutGrid },
  { href: "/transactions" as const, label: "Txns", icon: ReceiptText },
  { href: "/banking" as const, label: "Bank", icon: Building2 },
  { href: "/investments" as const, label: "Invest", icon: LineChart },
  { href: "/debt-tracker" as const, label: "Debts", icon: CircleDollarSign },
  { href: "/goals" as const, label: "Goals", icon: Flag }
];

export function MobileNav() {
  return (
    <nav className="panel sticky bottom-4 z-20 mt-4 grid grid-cols-3 gap-3 p-3 sm:grid-cols-6 lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-[22px] px-4 py-4 text-[11px] font-semibold text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
