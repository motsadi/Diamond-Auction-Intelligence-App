'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

function SimulationContent() {
  return (
    <AppShell title="Auction Simulation & Strategy" subtitle="Coming soon">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">Auction Simulation & Bidding Strategy Testing</h1>
        <p className="mt-2 text-gray-700">
          This module will let you simulate auctions, test reserve policies, and evaluate bidding strategies under
          different demand scenarios.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: 'Scenario builder', desc: 'Define demand, buyer behavior, and constraints.' },
            { title: 'Monte Carlo simulation', desc: 'Estimate outcomes and downside risk across runs.' },
            { title: 'Policy testing', desc: 'Compare reserve strategies and lot sequencing.' },
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

export default function SimulationPage() {
  return (
    <ProtectedRoute>
      <SimulationContent />
    </ProtectedRoute>
  );
}


