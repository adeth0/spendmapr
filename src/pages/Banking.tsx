import { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Trash2, X, Wallet, CreditCard, PiggyBank } from 'lucide-react';

interface Account {
  id: string; name: string; type: string; balance: number; institution: string;
}

const LS_KEY = 'spendmapr_accounts';
const TYPES  = ['Current Account','Savings Account','Credit Card','ISA','Cash','Other'];

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  'Current Account': Wallet,
  'Savings Account': PiggyBank,
  'Cash':            Wallet,
  'ISA':             PiggyBank,
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

export function Banking() {
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Current Account', balance: '', institution: '' });
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(accounts)); }, [accounts]);
  useEffect(() => { if (showForm) setTimeout(() => nameRef.current?.focus(), 50); }, [showForm]);

  const reset = () => setForm({ name: '', type: 'Current Account', balance: '', institution: '' });
  const close = () => { setShowForm(false); reset(); };

  const handleAdd = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAccounts(p => [{
      id: crypto.randomUUID(), name: form.name.trim(), type: form.type,
      balance: parseFloat(form.balance) || 0, institution: form.institution.trim(),
    }, ...p]);
    close();
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const posBalance   = accounts.filter(a => a.balance >= 0).reduce((s, a) => s + a.balance, 0);
  const negBalance   = accounts.filter(a => a.balance <  0).reduce((s, a) => s + a.balance, 0);

  return (
    <div className="page-shell">
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="section-title">Banking</h1>
            <p className="section-copy">Track your accounts and balances.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="apple-button-primary whitespace-nowrap">
            <Plus size={16} /> Add Account
          </button>
        </div>

        {/* Summary */}
        {accounts.length > 0 && (
          <div className="panel p-5 flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Total Balance</p>
              <p className="text-2xl font-bold" style={{ color: totalBalance >= 0 ? 'var(--text-1)' : 'var(--red)' }}>
                {fmt(totalBalance)}
              </p>
            </div>
            {posBalance > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Funds Available</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--green)' }}>{fmt(posBalance)}</p>
              </div>
            )}
            {negBalance < 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-3)' }}>Credit Used</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--red)' }}>{fmt(Math.abs(negBalance))}</p>
              </div>
            )}
          </div>
        )}

        {/* Account list */}
        {accounts.length === 0 ? (
          <div className="panel">
            <div className="empty-state flex-col space-y-4">
              <div className="text-5xl">🏦</div>
              <h3 className="empty-state-title">No accounts added</h3>
              <p className="empty-state-copy">Add your bank accounts to track balances and net worth.</p>
              <button onClick={() => setShowForm(true)} className="apple-button-primary">Add account</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map(account => {
              const Icon = TYPE_ICONS[account.type] || CreditCard;
              const isNeg = account.balance < 0;
              return (
                <div key={account.id} className="panel interactive-card p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--bg-raised)' }}>
                        <Icon size={18} style={{ color: 'var(--text-2)' }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">{account.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {account.institution ? `${account.institution} · ` : ''}{account.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAccounts(p => p.filter(a => a.id !== account.id))}
                      className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                      style={{ color: 'var(--text-3)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                      aria-label="Delete account">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>Balance</p>
                    <p className="text-2xl font-bold" style={{ color: isNeg ? 'var(--red)' : 'var(--text-1)' }}>
                      {fmt(account.balance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Open Banking coming soon */}
        <div className="panel p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)' }}>
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Open Banking</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Automatic bank sync — coming soon</p>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
            Connect your bank securely using Open Banking (FCA regulated) to automatically sync transactions and balances.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {['Barclays','HSBC','Lloyds','NatWest','Starling','Monzo','Chase','Halifax'].map(bank => (
              <span key={bank} className="badge-muted">{bank}</span>
            ))}
          </div>
          <button disabled className="apple-button-secondary opacity-40 cursor-not-allowed">
            Coming soon
          </button>
        </div>

      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={close}>
          <form
            className="w-full sm:max-w-md p-6 space-y-5 rounded-t-3xl sm:rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', maxHeight: '92dvh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
            onSubmit={handleAdd}
          >
            <div className="sm:hidden flex justify-center -mt-2 mb-1">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Add Account</h2>
              <button type="button" onClick={close} className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Account name *</label>
                <input ref={nameRef} required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Main Current Account" className="apple-input" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Bank / institution</label>
                <input value={form.institution}
                  onChange={e => setForm(f => ({ ...f, institution: e.target.value }))}
                  placeholder="e.g. Monzo" className="apple-input" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Account type *</label>
                <select required value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="apple-input">
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-2)' }}>Current balance (£) *</label>
                <input required type="number" step="any" value={form.balance}
                  onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                  placeholder="1500.00" className="apple-input" />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
                  Use a negative number for credit card balances owed.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={close} className="apple-button-secondary flex-1">Cancel</button>
              <button type="submit" className="apple-button-primary flex-1">
                <Building2 size={15} /> Add Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
