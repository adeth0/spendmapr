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
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/banking', label: 'Banking', icon: Building2 },
  { path: '/investments', label: 'Investments', icon: TrendingUp },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/debt-tracker', label: 'Debt', icon: CreditCard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
];

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Close mobile menu when navigating
  React.useEffect(() => {
    setMobileMenuOpen(false);
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
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-slate-900">SpendMapr</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed right-0 top-0 bottom-0 w-64 bg-white shadow-lg p-6 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <nav className="space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile user + logout */}
            <div className="pt-6 mt-6 border-t border-slate-200 space-y-3">
              <div className="flex items-center gap-3 px-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <User size={16} className="text-slate-500" />
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">
                  {displayName}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <LogOut size={18} />
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar — Desktop */}
        <aside className="hidden lg:flex w-64 fixed left-0 top-0 bottom-0 bg-white border-r border-slate-200 p-6 flex-col">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-slate-900">SpendMapr</h1>
            <p className="text-sm text-slate-500 mt-1">Personal Finance</p>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop user + logout */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-3 px-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-slate-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{displayName}</p>
                {user?.email && (
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <LogOut size={16} />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
          <ToastContainer />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
