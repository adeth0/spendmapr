import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Goals() {
  return (
    <div className="page-shell">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Goals</h1>
          <p className="section-copy">
            Set and track your financial goals.
          </p>
        </div>

        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>
              Set up savings goals and track your progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="empty-state">
              <div className="text-center">
                <h3 className="empty-state-title">No Goals Set</h3>
                <p className="empty-state-copy">
                  Create your first savings goal to start tracking your progress.
                </p>
                <div className="mt-6">
                  <button className="apple-button-primary">
                    Create Goal
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