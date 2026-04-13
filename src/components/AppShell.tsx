import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastContainer } from './ui/Toast';
import {
  LayoutDashboard, Building2, TrendingUp, Target, Receipt,
  CreditCard, LogOut, MoreHorizontal, X, ChevronRight,
} from 'lucide-react';

const primaryNav = [
  { path: '/dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { path: '/banking',      label: 'Banking',      icon: Building2 },
  { path: '/investments',  label: 'Investments',  icon: TrendingUp },
  { path: '/goals',        label: 'Goals',        icon: Target },
  { path: '/debt-tracker', label: 'Debt',         icon: CreditCard },
];

const sidebarNav = [
  ...primaryNav,
  { path: '/transactions', label: 'Transactions', icon: Receipt },
];

export function AppShell() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  React.useEffect(() => { setMoreOpen(false); }, [location]);

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
  const initials  = displayName.slice(0, 2).toUpperCase();

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100dvh' }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex w-60 fixed left-0 top-0 bottom-0 flex-col z-30"
        style={{ background: '#080d14', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-base tracking-tight">SpendMapr</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 pt-2">
          {sidebarNav.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200',
                ].join(' ')}
                style={isActive ? {
                  background: 'rgba(59,130,246,0.15)',
                  borderLeft: '2px solid var(--accent)',
                  paddingLeft: '10px',
                } : {}}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 px-3 mb-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                style={{ background: 'var(--accent)' }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              {user?.email && <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{user.email}</p>}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            style={{ color: '#ef4444' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="lg:ml-60">
        <ToastContainer />
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ───────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          background: '#080d14',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {primaryNav.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative"
              aria-label={item.label}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}
              />
              <span className="text-[9px] font-medium leading-tight" style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px]"
          aria-label="More"
        >
          <MoreHorizontal size={22} strokeWidth={1.6} style={{ color: 'var(--text-3)' }} />
          <span className="text-[9px] font-medium leading-tight" style={{ color: 'var(--text-3)' }}>More</span>
        </button>
      </nav>

      {/* ── More bottom sheet ────────────────────────────────────────────────── */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div
            className="relative w-full rounded-t-3xl p-5 space-y-1"
            style={{ background: 'var(--bg-card)', paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center -mt-1 mb-4">
              <div className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
            </div>

            {/* User info */}
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'var(--accent)' }}>
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{displayName}</p>
                  {user?.email && <p className="text-xs" style={{ color: 'var(--text-3)' }}>{user.email}</p>}
                </div>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="h-9 w-9 rounded-full flex items-center justify-center"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-2)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Transactions link */}
            <NavLink
              to="/transactions"
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors"
              style={{
                background: location.pathname === '/transactions' ? 'rgba(59,130,246,0.12)' : 'var(--bg-raised)',
                color: location.pathname === '/transactions' ? 'var(--accent)' : 'var(--text-1)',
              }}
            >
              <div className="flex items-center gap-3">
                <Receipt size={19} />
                <span className="font-medium text-sm">Transactions</span>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
            </NavLink>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl font-medium text-sm transition-colors disabled:opacity-50 mt-2"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
            >
              <LogOut size={19} />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
