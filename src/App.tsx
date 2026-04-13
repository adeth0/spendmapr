import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import { Banking } from './pages/Banking';
import { DebtTracker } from './pages/DebtTracker';
import { Goals } from './pages/Goals';
import { Transactions } from './pages/Transactions';
import { AppShell } from './components/AppShell';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy-load Investments to defer the ~400 kB recharts bundle
const Investments = lazy(() =>
  import('./pages/Investments').then(m => ({ default: m.Investments }))
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  // While loading (e.g. restoring session on mount), show full-screen spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected routes — all wrapped in AppShell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="banking" element={<Banking />} />
          <Route path="debt-tracker" element={<DebtTracker />} />
          {/* /debts alias */}
          <Route path="debts" element={<Navigate to="/debt-tracker" replace />} />
          <Route path="goals" element={<Goals />} />
          <Route path="investments" element={<Suspense fallback={<PageLoader />}><Investments /></Suspense>} />
          <Route path="transactions" element={<Transactions />} />
        </Route>

        {/* Catch-all → dashboard (or login if unauthenticated) */}
        <Route
          path="*"
          element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
