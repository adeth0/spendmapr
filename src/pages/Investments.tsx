import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Investments() {
  return (
    <div className="page-shell">
      <div className="space-y-6">
        <div>
          <h1 className="section-title">Investments</h1>
          <p className="section-copy">
            Track your investment portfolio and performance.
          </p>
        </div>

        <Card className="interactive-card">
          <CardHeader>
            <CardTitle>Investment Overview</CardTitle>
            <CardDescription>
              Track your investment performance and holdings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="empty-state">
              <div className="text-center">
                <h3 className="empty-state-title">No Investments Added</h3>
                <p className="empty-state-copy">
                  Add your investment accounts to track performance and holdings.
                </p>
                <div className="mt-6">
                  <button className="apple-button-primary">
                    Add Investment Account
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