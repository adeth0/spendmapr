import { BarChart3, PiggyBank, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BudgetOverviewCard } from "@/components/budget-overview-card";
import { Card } from "@/components/ui/card";
import { ChartCard } from "@/components/chart-card";
import { CashflowForecastCard } from "@/components/cashflow-forecast-card";
import { InsightsCard } from "@/components/insights-card";
import { OverviewCard } from "@/components/overview-card";
import { SubscriptionsCard } from "@/components/subscriptions-card";
import { DashboardRefresh } from "@/components/dashboard-refresh";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardData } from "@/lib/data/queries";
import { formatCurrency, formatPercent } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <AppShell
      title="Dashboard"
      description="A calm overview of your balance, spending, and savings progress."
    >
      <DashboardRefresh />
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <OverviewCard
          title="Total balance"
          value={formatCurrency(data.totalBalance)}
          detail="Connected bank balance plus savings minus debt"
          icon={Wallet}
          tone="brand"
        />
        <OverviewCard
          title="Monthly spending"
          value={formatCurrency(data.monthlySpending)}
          detail="Expense transactions recorded this month"
          icon={BarChart3}
          tone="danger"
        />
        <OverviewCard
          title="Monthly budget"
          value={`${formatCurrency(data.budget.totalActual)} / ${formatCurrency(data.budget.totalBudget)}`}
          detail={
            data.budget.totalActual > data.budget.totalBudget
              ? "You are over budget this month"
              : "You are tracking within budget this month"
          }
          icon={BarChart3}
          tone={data.budget.totalActual > data.budget.totalBudget ? "danger" : "brand"}
        />
        <OverviewCard
          title="Savings progress"
          value={formatPercent(data.savingsProgress)}
          detail="Average completion across all active goals"
          icon={PiggyBank}
          tone="success"
        />
      </section>

      <section className="grid gap-4">
        <CashflowForecastCard forecast={data.forecast} />
      </section>

      <section className="grid gap-4">
        <SubscriptionsCard
          subscriptions={data.subscriptions}
          totalMonthlyCost={data.subscriptionMonthlyTotal}
        />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.5fr)_380px]">
        <ChartCard
          title="Spending over time"
          description="Expenses grouped by month"
          data={data.chartData}
        />

        <div className="grid gap-4">
          <Card className="p-7 sm:p-8">
            <SectionHeader
              title="At a glance"
              description="Quick signals from your latest activity."
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <StatCard label="Recent transactions" value={data.transactionCount} />
              <StatCard label="Active debts" value={data.debtCount} />
              <StatCard label="Active goals" value={data.goalCount} />
              <StatCard label="Debt payoff" value={formatPercent(data.debtPayoffProgress)} />
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
        <BudgetOverviewCard budget={data.budget} />
        <InsightsCard insights={data.budget.insights} />
      </section>
    </AppShell>
  );
}
