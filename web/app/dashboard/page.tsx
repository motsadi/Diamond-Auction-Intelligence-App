'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/instant';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

function DashboardContent() {
  const { user, isLoading: authLoading } = useAuth();

  // Only run the query once we have a user; otherwise keep loading state.
  const { data, isLoading } = user
    ? db.useQuery({
        datasets: {
          $: { where: { ownerId: user.id } },
        },
        predictions: {
          $: { where: { ownerId: user.id }, order: { createdAt: 'desc' }, limit: 5 },
        },
      })
    : { data: null, isLoading: authLoading || true };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const datasets = data?.datasets || [];
  const recentPredictions = data?.predictions || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Datasets</h3>
            <p className="text-3xl font-bold text-indigo-600">{datasets.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Predictions</h3>
            <p className="text-3xl font-bold text-indigo-600">{recentPredictions.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Activity</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {recentPredictions.length > 0 ? 'Active' : 'None'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
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

          <div className="bg-white p-6 rounded-lg shadow-md">
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
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}












