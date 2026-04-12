import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, signOut, isDemoMode } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-shell">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="section-title">Dashboard</h1>
            <p className="section-copy">
              Welcome back{user?.email ? ` ${user.email}` : ''}! 
              {isDemoMode && " You're using demo mode - no data will be saved."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/banking')}
            >
              Banking
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/investments')}
            >
              Investments
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/goals')}
            >
              Goals
            </Button>
            <Button onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="interactive-card">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Financial summary and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total Balance</span>
                  <span className="font-semibold">£0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Monthly Income</span>
                  <span className="font-semibold">£0.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Monthly Expenses</span>
                  <span className="font-semibold">£0.00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="interactive-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with SpendMapr</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/banking')}
              >
                Connect Bank Account
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/investments')}
              >
                Add Investments
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/goals')}
              >
                Set Goals
              </Button>
            </CardContent>
          </Card>

          <Card className="interactive-card">
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
              <CardDescription>Need assistance?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  {isDemoMode 
                    ? "You're in demo mode. Try connecting a bank account or adding investments to see the full features."
                    : "Start by connecting your bank account to begin tracking your finances."
                  }
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('https://github.com/adeth0/spendmapr', '_blank')}
                >
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}