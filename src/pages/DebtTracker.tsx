import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function DebtTracker() {
  return (
    <div className="page-shell">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Debt Tracker</h1>
          <p className="section-copy">
            Track and manage your debts effectively.
          </p>
        </div>

        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Debt Management</CardTitle>
            <CardDescription>
              Add your debts and track your progress towards becoming debt-free.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="empty-state">
              <div className="text-center">
                <h3 className="empty-state-title">No Debts Added</h3>
                <p className="empty-state-copy">
                  Add your debts to start tracking and managing them.
                </p>
                <div className="mt-6">
                  <button className="apple-button-primary">
                    Add Debt
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