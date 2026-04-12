import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { TransactionForm } from "@/components/forms/transaction-form";
import { TransactionList } from "@/components/transaction-list";
import { getBankingDataForUser } from "@/lib/data/banking-queries";
import { getInvestmentSnapshot } from "@/lib/investments";
import { getTransactionsPageData } from "@/lib/data/queries";

export default async function TransactionsPage() {
  const data = await getTransactionsPageData();
  const bankData = await getBankingDataForUser();
  const snapshot = await getInvestmentSnapshot();

  const bankBalance = bankData.accounts.reduce(
    (total, account) => total + (account.current_balance ?? 0),
    0
  );
  const useTestBalance = bankData.accounts.length === 0;
  const currentBalance = useTestBalance ? 3000 : bankBalance;

  return (
    <AppShell
      title="Transactions"
      description="Track income and expenses with simple categories and notes."
    >
      <section className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)] 2xl:grid-cols-[430px_minmax(0,1fr)] xl:items-start">
        <TransactionForm
          currentBalance={currentBalance}
          useTestBalance={useTestBalance}
          transactions={data.transactions}
          investmentSnapshot={snapshot}
        />

        {data.transactions.length > 0 ? (
          <TransactionList transactions={data.transactions} />
        ) : (
          <EmptyState
            title="No transactions yet"
            copy="Add your first income or expense to start building your spending history."
          />
        )}
      </section>
    </AppShell>
  );
}
