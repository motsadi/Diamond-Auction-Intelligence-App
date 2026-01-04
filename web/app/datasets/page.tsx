'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import Link from 'next/link';
import { staticDataset, usDiamondsDataset } from '@/lib/staticDataset';

function DatasetsContent() {
  const datasets = [staticDataset, usDiamondsDataset];

  return (
    <AppShell title="Datasets" subtitle="Source data for forecasts and reports">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datasets</h1>
          <div className="text-sm text-gray-600">
            Uploads are disabled in this demo. Using built-in datasets.
          </div>
        </div>
        <Link href="/reports" className="btn-secondary">
          Generate report
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {datasets.map((dataset: any) => (
          <Link
            key={dataset.id}
            href={`/datasets/${dataset.id}`}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-1 text-gray-900">{dataset.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {new Date(dataset.createdAt).toLocaleDateString()}
            </p>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700">
                <span className="font-medium">Rows:</span> {dataset.rowCount}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Columns:</span> {dataset.columns?.length || 0}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}

export default function DatasetsPage() {
  return (
    <ProtectedRoute>
      <DatasetsContent />
    </ProtectedRoute>
  );
}












