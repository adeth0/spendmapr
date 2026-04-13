export function Transactions() {
  return (
    <div className="page-shell">
      <div className="space-y-5">
        <div>
          <h1 className="section-title">Transactions</h1>
          <p className="section-copy">View and manage your transactions.</p>
        </div>

        <div className="panel">
          <div className="empty-state flex-col space-y-4">
            <div className="text-5xl">📊</div>
            <h3 className="empty-state-title">No transactions yet</h3>
            <p className="empty-state-copy">
              Connect your bank account via Open Banking to automatically sync your transactions.
            </p>
            <button
              disabled
              className="apple-button-secondary opacity-50 cursor-not-allowed"
            >
              Coming soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
