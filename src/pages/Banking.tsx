import { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, Plus, Trash2, X, Wallet, CreditCard, PiggyBank, Loader2, Unplug, ArrowDown, ArrowUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  initTrueLayerConnect, handleTrueLayerCallback,
  syncTrueLayerData, getConnectedBankAccounts,
  getRecentTransactions, checkTrueLayerConnection,
  disconnectTrueLayer, CATEGORY_COLORS,
  type BankAccountRow, type TransactionRow,
} from '../lib/bankingService';

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

  // ── Real TrueLayer Open Banking state ─────────────────────────────────────
  const { user, isDemoMode }            = useAuth();
  const [tlConnected,  setTlConnected]  = useState(false);
  const [tlChecking,   setTlChecking]   = useState(true);
  const [tlConnecting, setTlConnecting] = useState(false);
  const [tlSyncing,    setTlSyncing]    = useState(false);
  const [tlError,      setTlError]      = useState<string | null>(null);
  const [tlAccounts,   setTlAccounts]   = useState<BankAccountRow[]>([]);
  const [tlTxns,       setTlTxns]       = useState<TransactionRow[]>([]);
  const [tlShowTxns,   setTlShowTxns]   = useState(false);

  // Load accounts + transactions from Supabase after connect / sync
  const loadTlData = useCallback(async () => {
    const [accs, txns] = await Promise.all([
      getConnectedBankAccounts(supabase),
      getRecentTransactions(supabase, 50),
    ]);
    setTlAccounts(accs);
    setTlTxns(txns);
    setTlConnected(true);
    setTlChecking(false);
  }, []);

  // On mount: handle OAuth callback or check existing connection
  useEffect(() => {
    if (!user || isDemoMode) { setTlChecking(false); return; }

    const params = new URLSearchParams(window.location.search);
    const code   = params.get('code');
    const state  = params.get('state');
    const errParam = params.get('error');

    // Always clear TrueLayer params from the URL
    if (code || errParam) {
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (errParam) {
      setTlError(errParam === 'access_denied'
        ? 'Connection cancelled.'
        : `TrueLayer error: ${errParam}`);
      setTlChecking(false);
      return;
    }

    if (code) {
      // Exchange code + sync data
      setTlConnecting(true);
      handleTrueLayerCallback(supabase, code, state ?? '')
        .then(() => loadTlData())
        .catch(e => { setTlError((e as Error).message); setTlChecking(false); })
        .finally(() => setTlConnecting(false));
      return;
    }

    // No callback — check if already connected
    checkTrueLayerConnection(supabase)
      .then(connected => {
        if (connected) return loadTlData();
        setTlChecking(false);
      })
      .catch(() => setTlChecking(false));
  }, [user?.id, isDemoMode, loadTlData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    setTlError(null);
    setTlConnecting(true);
    try {
      const url = await initTrueLayerConnect(supabase);
      window.location.href = url;
    } catch (e) {
      setTlError((e as Error).message);
      setTlConnecting(false);
    }
  };

  const handleSync = async () => {
    setTlSyncing(true);
    setTlError(null);
    try {
      await syncTrueLayerData(supabase);
      await loadTlData();
    } catch (e) {
      setTlError((e as Error).message);
    } finally {
      setTlSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    try {
      await disconnectTrueLayer(supabase, user.id);
      setTlConnected(false);
      setTlAccounts([]);
      setTlTxns([]);
      setTlShowTxns(false);
      setTlError(null);
    } catch (e) {
      setTlError((e as Error).message);
    }
  };

  const fmtTxnDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

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

        {/* ── Open Banking (TrueLayer) ────────────────────────────────────────── */}
        <div className="panel p-5 space-y-4">

          {/* Section header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: tlConnected ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)' }}>
                <Building2 size={18} style={{ color: tlConnected ? '#22c55e' : 'var(--accent)' }} />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Open Banking</p>
                <p className="text-xs" style={{ color: tlConnected ? '#22c55e' : 'var(--text-3)' }}>
                  {tlChecking   ? 'Checking connection…'           :
                   tlConnecting ? 'Connecting…'                    :
                   tlConnected  ? 'Connected via TrueLayer'        :
                                  'Automatic bank sync via TrueLayer'}
                </p>
              </div>
            </div>

            {/* Connected: sync + disconnect buttons */}
            {tlConnected && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSync}
                  disabled={tlSyncing}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ color: 'var(--text-2)', background: 'var(--bg-raised)' }}
                >
                  <RefreshCw size={12} className={tlSyncing ? 'animate-spin' : ''} />
                  {tlSyncing ? 'Syncing…' : 'Sync'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-3)', background: 'var(--bg-raised)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
                >
                  <Unplug size={12} /> Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Error banner */}
          {tlError && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)' }}>
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              <span>{tlError}</span>
            </div>
          )}

          {/* Connecting spinner (OAuth callback in progress) */}
          {tlConnecting && (
            <div className="flex items-center gap-3 py-2">
              <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Exchanging tokens and syncing your account data…
              </p>
            </div>
          )}

          {/* Connected: account tiles */}
          {tlConnected && tlAccounts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tlAccounts.map((acc: BankAccountRow) => (
                <div key={acc.id} className="rounded-xl p-4 space-y-2"
                  style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-3)' }}>
                      {acc.provider_display_name
                        ? `${acc.provider_display_name} · ${acc.account_type}`
                        : acc.account_type}
                    </p>
                    <span className="badge-muted flex-shrink-0">{acc.currency}</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {acc.balance !== null ? fmt(acc.balance) : '—'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                    {acc.display_name}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Connected: recent transactions */}
          {tlConnected && (
            <div>
              <button
                onClick={() => setTlShowTxns((v: boolean) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold w-full justify-between px-1 py-1 transition-opacity hover:opacity-70"
                style={{ color: 'var(--text-2)' }}
              >
                <span>Recent transactions ({tlTxns.length})</span>
                <span style={{ color: 'var(--text-3)' }}>{tlShowTxns ? '▲ Hide' : '▼ Show'}</span>
              </button>

              {tlShowTxns && (
                <div className="mt-2 space-y-1">
                  {tlTxns.map((txn: TransactionRow) => {
                    const isCredit = txn.amount > 0;
                    const label    = txn.merchant_name || txn.description || 'Transaction';
                    const color    = CATEGORY_COLORS[txn.category ?? ''] ?? 'var(--text-3)';
                    return (
                      <div key={txn.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: 'var(--bg-raised)' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${color}18` }}>
                            {isCredit
                              ? <ArrowDown size={13} style={{ color }} />
                              : <ArrowUp   size={13} style={{ color }} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{label}</p>
                            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                              {txn.category ?? 'Other'} · {fmtTxnDate(txn.transaction_at)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold flex-shrink-0 ml-3"
                          style={{ color: isCredit ? '#22c55e' : 'var(--text-1)' }}>
                          {isCredit ? '+' : ''}{fmt(txn.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Not connected + not checking: connect prompt */}
          {!tlConnected && !tlChecking && !tlConnecting && (
            <>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                Connect your bank securely using Open Banking (FCA regulated) to automatically sync
                transactions and balances. Powered by TrueLayer.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Barclays','HSBC','Lloyds','NatWest','Starling','Monzo','Chase','Halifax'].map(bank => (
                  <span key={bank} className="badge-muted">{bank}</span>
                ))}
              </div>
              {isDemoMode ? (
                <p className="text-xs px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--bg-raised)', color: 'var(--text-3)' }}>
                  Open Banking requires a Supabase-authenticated account and is not available in demo mode.
                </p>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={tlConnecting}
                  className="apple-button-primary disabled:opacity-60"
                >
                  {tlConnecting
                    ? <><Loader2 size={15} className="animate-spin" /> Connecting…</>
                    : <><Building2 size={15} /> Connect with Monzo</>}
                </button>
              )}
            </>
          )}

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
