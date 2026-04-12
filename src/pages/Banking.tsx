import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Banking() {
  return (
    <div className="page-shell">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Banking</h1>
          <p className="section-copy">
            Connect your bank accounts and track your spending.
          </p>
        </div>

        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Connect Your Bank</CardTitle>
            <CardDescription>
              Securely connect your bank accounts using Open Banking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="empty-state">
              <div className="text-center">
                <h3 className="empty-state-title">No Bank Connected</h3>
                <p className="empty-state-copy">
                  Connect your bank account to start tracking your transactions and balance.
                </p>
                <div className="mt-6">
                  <button className="apple-button-primary">
                    Connect Bank Account
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}