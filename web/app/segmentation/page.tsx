'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';

function SegmentationContent() {
  return (
    <AppShell title="Segmentation & Recommendations" subtitle="Coming soon">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">Buyer Segmentation & Recommendation Systems</h1>
        <p className="mt-2 text-gray-700">
          This module will help auction teams understand buyer segments, recommend lots, and improve auction design and
          matching between supply and demand.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { title: 'Segmentation', desc: 'Cluster buyers by behavior, categories, and price sensitivity.' },
            { title: 'Recommendations', desc: 'Recommend lots to buyers based on historical intent.' },
            { title: 'Demand shaping', desc: 'Optimize lot grouping and sequencing to improve outcomes.' },
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

export default function SegmentationPage() {
  return (
    <ProtectedRoute>
      <SegmentationContent />
    </ProtectedRoute>
  );
}


