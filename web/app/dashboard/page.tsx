'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { db } from '@/lib/instant';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

function DashboardContent() {
  const { user } = useAuth();
  const ownerId = user?.id ?? '';

  // Note: call hooks unconditionally (no conditional `useQuery`).
  const { data, isLoading } = db.useQuery({
    datasets: {
      $: { where: { ownerId } },
    },
    predictions: {
      $: { where: { ownerId } },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const datasets = data?.datasets || [];
  const recentPredictions =
    (data?.predictions || [])
      .slice()
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);

  return (
    <AppShell title="Overview" subtitle="Operational snapshot and quick links">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600">Okavango Diamond Company</div>
          <h1 className="text-2xl font-bold text-gray-900">Today’s overview</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/forecast" className="btn-primary">
            Run forecast
          </Link>
          <Link href="/reports" className="btn-secondary">
            Generate report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Datasets</h3>
            <p className="text-3xl font-bold text-indigo-600">{datasets.length}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Predictions</h3>
            <p className="text-3xl font-bold text-indigo-600">{recentPredictions.length}</p>
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Activity</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {recentPredictions.length > 0 ? 'Active' : 'None'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Datasets</h2>
              <Link href="/datasets" className="text-indigo-600 hover:underline text-sm">
                View All
              </Link>
            </div>
            {datasets.length === 0 ? (
              <p className="text-gray-500">No datasets yet. <Link href="/datasets/new" className="text-indigo-600 hover:underline">Upload one</Link></p>
            ) : (
              <ul className="space-y-2">
                {datasets.slice(0, 5).map((dataset: any) => (
                  <li key={dataset.id} className="flex justify-between items-center">
                    <Link href={`/datasets/${dataset.id}`} className="text-indigo-600 hover:underline">
                      {dataset.name}
                    </Link>
                    <span className="text-sm text-gray-500">{dataset.rowCount} rows</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Predictions</h2>
              <Link href="/history" className="text-indigo-600 hover:underline text-sm">
                View All
              </Link>
            </div>
            {recentPredictions.length === 0 ? (
              <p className="text-gray-500">No predictions yet. <Link href="/forecast" className="text-indigo-600 hover:underline">Run one</Link></p>
            ) : (
              <ul className="space-y-2">
                {recentPredictions.map((pred: any) => (
                  <li key={pred.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{pred.modelName}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(pred.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {pred.metrics && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          R²: {pred.metrics.price_r2?.toFixed(3) || 'N/A'}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}












