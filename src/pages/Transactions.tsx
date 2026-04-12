import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Transactions() {
  return (
    <div className="page-shell">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Transactions</h1>
          <p className="section-copy">
            View and manage your transactions.
          </p>
        </div>

        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              View your recent transactions and categorize them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="empty-state">
              <div className="text-center">
                <h3 className="empty-state-title">No Transactions</h3>
                <p className="empty-state-copy">
                  Connect your bank account to see your transactions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}