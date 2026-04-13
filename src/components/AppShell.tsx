import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer } from './ui/Toast';
import {
  LayoutDashboard,
  Building2,
  TrendingUp,
  Target,
  Receipt,
  CreditCard,
  LogOut,
  User,
  MoreHorizontal,
  X,
} from 'lucide-react';

// 5 primary items for bottom nav; Transactions lives under "More"
const bottomNavItems = [
  { path: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/banking',      label: 'Banking',      icon: Building2 },
  { path: '/investments',  label: 'Invest',       icon: TrendingUp },
  { path: '/goals',        label: 'Goals',        icon: Target },
  { path: '/debt-tracker', label: 'Debt',         icon: CreditCard },
];

const sidebarItems = [
  { path: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { path: '/banking',      label: 'Banking',      icon: Building2 },
  { path: '/investments',  label: 'Investments',  icon: TrendingUp },
  { path: '/goals',        label: 'Goals',        icon: Target },
  { path: '/debt-tracker', label: 'Debt Tracker', icon: CreditCard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
];

export function AppShell() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Close "more" drawer on navigation
  React.useEffect(() => {
    setMoreOpen(false);
  }, [location]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Account';

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="min-h-dvh bg-[#F7F8FA]">

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200 p-6 flex-col z-30">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">SpendMapr</h1>
          <p className="text-sm text-slate-500 mt-1">Personal Finance</p>
        </div>

        <nav className="space-y-1 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop user + sign-out */}
        <div className="pt-5 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                <User size={15} className="text-slate-500" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{displayName}</p>
              {user?.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <LogOut size={15} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="lg:ml-64">
        <ToastContainer />
        <Outlet />
      </main>

      {/* ── Mobile sticky bottom nav ─────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
                aria-label={item.label}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-slate-900 rounded-full" />
                )}
              </NavLink>
            );
          })}

          {/* "More" button → slide-up sheet */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
              moreOpen ? 'text-slate-900' : 'text-slate-400'
            }`}
            aria-label="More options"
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* ── Mobile "More" bottom sheet ──────────────────────────────────── */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end"
          onClick={() => setMoreOpen(false)}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full bg-white rounded-t-3xl shadow-2xl p-5 pb-safe space-y-1"
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center">
                    <User size={16} className="text-slate-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  {user?.email && <p className="text-xs text-slate-400">{user.email}</p>}
                </div>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Transactions link */}
            <NavLink
              to="/transactions"
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors ${
                location.pathname === '/transactions' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Receipt size={20} />
              <span className="font-medium">Transactions</span>
            </NavLink>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-red-600 hover:bg-red-50 transition-colors font-medium disabled:opacity-50 mt-2"
            >
              <LogOut size={20} />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
