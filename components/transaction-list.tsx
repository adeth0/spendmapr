import { deleteTransaction } from "@/lib/actions";
import { EditTransactionForm } from "@/components/forms/edit-transaction-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DeleteButton } from "@/components/ui/delete-button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import type { Transaction } from "@/lib/types";

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="p-7 sm:p-8">
      <SectionHeader
        title="Recent activity"
        description="Every income and expense in a clean, editable ledger."
      />

      <div className="mt-8 space-y-4">
        {transactions.map((transaction) => (
          <article
            key={transaction.id}
            className="surface-muted interactive-card rounded-3xl shadow-sm flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex-1 space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{transaction.title}</h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                    {transaction.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      transaction.type === "income"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {transaction.type}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {formatDate(transaction.transaction_date)}
                  {transaction.notes ? ` - ${transaction.notes}` : ""}
                </p>
              </div>

              <EditTransactionForm transaction={transaction} />
            </div>

            <div className="flex items-center gap-3 sm:pt-1">
              <p className="text-xl font-semibold tracking-tight text-slate-900">
                {transaction.type === "expense" ? "-" : "+"}
                {formatCurrency(transaction.amount)}
              </p>
              <form action={deleteTransaction}>
                <input type="hidden" name="id" value={transaction.id} />
                <DeleteButton label="Delete transaction" />
              </form>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
