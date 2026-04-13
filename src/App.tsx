import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Banking } from './pages/Banking';
import { DebtTracker } from './pages/DebtTracker';
import { Goals } from './pages/Goals';
import { Transactions } from './pages/Transactions';
import { Onboarding } from './pages/Onboarding';
import { AppShell } from './components/AppShell';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import { Loader2 } from 'lucide-react';

// Lazy-load Investments to defer the ~400 kB recharts bundle
const Investments = lazy(() =>
  import('./pages/Investments').then(m => ({ default: m.Investments }))
);

// ─── Loaders ──────────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--text-3)' }} />
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;
  if (!user)     return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// ─── Onboarding gate ──────────────────────────────────────────────────────────
/**
 * Placed inside <BrowserRouter> so it can use useLocation.
 * Redirects authenticated users who haven't completed onboarding to /onboarding.
 * Exempt paths (login, callback, onboarding itself) are passed through.
 */
const ONBOARDING_EXEMPT = ['/login', '/auth/callback', '/onboarding'];

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user }                   = useAuth();
  const { profile, profileLoading } = useProfile();
  const location                   = useLocation();

  // Pass through public / onboarding routes
  if (ONBOARDING_EXEMPT.includes(location.pathname)) return <>{children}</>;

  // Waiting for profile fetch after auth
  if (user && profileLoading) return <FullScreenLoader />;

  // Authenticated but onboarding not complete → redirect
  if (user && !profileLoading && !profile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullScreenLoader />;

  return (
    <BrowserRouter>
      <OnboardingGate>
        <Routes>
          {/* Public */}
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Onboarding — auth required, no AppShell */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected — all wrapped in AppShell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<Dashboard />} />
            <Route path="banking"      element={<Banking />} />
            <Route path="debt-tracker" element={<DebtTracker />} />
            <Route path="debts"        element={<Navigate to="/debt-tracker" replace />} />
            <Route path="goals"        element={<Goals />} />
            <Route
              path="investments"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Investments />
                </Suspense>
              }
            />
            <Route path="transactions" element={<Transactions />} />
          </Route>

          {/* Catch-all */}
          <Route
            path="*"
            element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
          />
        </Routes>
      </OnboardingGate>
    </BrowserRouter>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <AppRoutes />
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
