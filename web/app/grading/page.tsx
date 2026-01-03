'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

function GradingContent() {
  return (
    <AppShell title="Grading & Valuation" subtitle="Coming soon">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">Diamond Grading & Valuation Enhancement</h1>
        <p className="mt-2 text-gray-700">
          This module will support grading consistency checks, valuation enhancement, and anomaly detection for lot
          attributes (e.g., outliers, suspicious combinations, or data entry issues).
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: 'Quality consistency', desc: 'Detect grading drift and systematic bias.' },
            { title: 'Valuation uplift', desc: 'Estimate value impacts from attribute adjustments.' },
            { title: 'Anomaly detection', desc: 'Flag unusual lots for review before auction.' },
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

export default function GradingPage() {
  return (
    <ProtectedRoute>
      <GradingContent />
    </ProtectedRoute>
  );
}


