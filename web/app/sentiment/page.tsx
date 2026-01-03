'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

function SentimentContent() {
  return (
    <AppShell title="Market Sentiment & Price-Risk" subtitle="Coming soon">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">Market Sentiment & Price-Risk Analytics</h1>
        <p className="mt-2 text-gray-700">
          This module will support daily market monitoring, price-risk analytics, and early warning signals for auction
          outcomes (e.g., demand shifts, volatility, confidence bands).
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: 'Sentiment index', desc: 'Track market tone across buyers and categories.' },
            { title: 'Price risk', desc: 'VaR / expected shortfall style risk for reserve decisions.' },
            { title: 'Alerts', desc: 'Notify when conditions deviate from recent baselines.' },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-gray-900">{c.title}</div>
              <div className="mt-1 text-sm text-gray-600">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function SentimentPage() {
  return (
    <ProtectedRoute>
      <SentimentContent />
    </ProtectedRoute>
  );
}


