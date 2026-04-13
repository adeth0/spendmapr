import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Building2, Plus, Trash2, X, Wallet, CreditCard, PiggyBank } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution: string;
}

const STORAGE_KEY = 'spendmapr_accounts';
const TYPES = ['Current Account', 'Savings Account', 'Credit Card', 'ISA', 'Cash', 'Other'];

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Current Account': Wallet,
  'Savings Account': PiggyBank,
  'Cash': Wallet,
  'ISA': PiggyBank,
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

export function Banking() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Current Account', balance: '', institution: '' });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    if (showForm) setTimeout(() => nameRef.current?.focus(), 50);
  }, [showForm]);

  const resetForm = () => setForm({ name: '', type: 'Current Account', balance: '', institution: '' });

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const account: Account = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      balance: parseFloat(form.balance) || 0,
      institution: form.institution.trim(),
    };
    setAccounts(prev => [account, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => setAccounts(prev => prev.filter(a => a.id !== id));

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const posBalance = accounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0);
  const negBalance = accounts.filter(a => a.balance < 0).reduce((s, a) => s + a.balance, 0);

  return (
    <div className="page-shell">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Banking</h1>
            <p className="section-copy">Track your accounts and monitor your balances.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="apple-button-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} />
            Add Account
          </button>
        </div>

        {/* Summary */}
        {accounts.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Balance</p>
              <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                {fmt(totalBalance)}
              </p>
            </div>
            {posBalance > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Funds Available</p>
                <p className="text-2xl font-bold text-emerald-600">{fmt(posBalance)}</p>
              </div>
            )}
            {negBalance < 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Credit Used</p>
                <p className="text-2xl font-bold text-red-500">{fmt(Math.abs(negBalance))}</p>
              </div>
            )}
          </div>
        )}

        {/* Account list */}
        {accounts.length === 0 ? (
          <Card className="interactive-card">
            <CardContent>
              <div className="empty-state">
                <div className="text-center space-y-4">
                  <div className="text-5xl">🏦</div>
                  <h3 className="empty-state-title">No Accounts Added</h3>
                  <p className="empty-state-copy">
                    Add your bank accounts manually to track your balances and net worth.
                  </p>
                  <button onClick={() => setShowForm(true)} className="apple-button-primary">
                    Add Account
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(account => {
              const Icon = TYPE_ICONS[account.type] || CreditCard;
              const isNeg = account.balance < 0;
              return (
                <div key={account.id} className="interactive-card panel p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 rounded-xl p-2.5">
                        <Icon size={18} className="text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{account.name}</h3>
                        <p className="text-xs text-slate-400">
                          {account.institution ? `${account.institution} · ` : ''}{account.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="text-slate-300 hover:text-red-400 transition-colors p-1 -mr-1 flex-shrink-0"
                      aria-label="Delete account"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-0.5">Balance</p>
                    <p className={`text-2xl font-bold ${isNeg ? 'text-red-500' : 'text-slate-900'}`}>
                      {fmt(account.balance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Open Banking coming soon */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 rounded-xl p-2">
                <Building2 size={18} className="text-white" />
              </div>
              <div>
                <CardTitle>Open Banking</CardTitle>
                <CardDescription>Automatic bank sync — coming soon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Connect your bank securely using Open Banking (FCA regulated) to automatically
              sync transactions and balances in real time.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Barclays', 'HSBC', 'Lloyds', 'NatWest', 'Starling', 'Monzo', 'Chase', 'Halifax'].map(bank => (
                <span key={bank} className="text-xs bg-slate-100 text-slate-500 rounded-lg px-3 py-1.5 font-medium">
                  {bank}
                </span>
              ))}
            </div>
            <button
              disabled
              className="apple-button-secondary mt-5 opacity-50 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Add Account Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => { setShowForm(false); resetForm(); }}
        >
          <form
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
            onClick={e => e.stopPropagation()}
            onSubmit={handleAdd}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Account</h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Account name *</label>
                <input ref={nameRef} required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Main Current Account"
                  className="apple-input" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Bank / institution</label>
                <input value={form.institution}
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  placeholder="e.g. Monzo"
                  className="apple-input" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Account type *</label>
                <select required value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="apple-input">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Current balance (£) *</label>
                <input required type="number" step="any" value={form.balance}
                  onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                  placeholder="1500.00"
                  className="apple-input" />
                <p className="text-xs text-slate-400 mt-1">Use a negative number for credit card balances owed.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" className="apple-button-primary flex-1">
                <Building2 size={15} className="mr-1.5" />
                Add Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
