'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/instant';
import { useQuery } from '@instantdb/react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

function HistoryContent() {
  const { user } = useAuth();
  // @ts-expect-error - useQuery type definition issue, works at runtime
  const { data, isLoading } = useQuery(db, {
    predictions: {
      $: { where: { ownerId: user?.id || '' } },
      $: { order: { createdAt: 'desc' } },
    },
    datasets: {},
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const predictions = data?.predictions || [];
  const datasets = data?.datasets || [];
  const datasetMap = new Map(datasets.map((ds: any) => [ds.id, ds]));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Prediction History</h1>

        {predictions.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-500 mb-4">No predictions yet.</p>
            <Link
              href="/forecast"
              className="text-indigo-600 hover:underline font-semibold"
            >
              Run your first forecast
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((pred: any) => {
              const dataset = datasetMap.get(pred.datasetId);
              return (
                <div key={pred.id} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {pred.modelName} Prediction
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Dataset: {dataset?.name || 'Unknown'} | {new Date(pred.createdAt).toLocaleString()}
                      </p>
                      {pred.horizon && (
                        <p className="text-sm text-gray-500">Horizon: {pred.horizon}</p>
                      )}
                    </div>
                    {pred.metrics && (
                      <div className="text-right">
                        {pred.metrics.price_r2 !== undefined && (
                          <p className="text-sm">
                            <span className="text-gray-500">R²:</span>{' '}
                            <span className="font-semibold">{pred.metrics.price_r2.toFixed(3)}</span>
                          </p>
                        )}
                        {pred.metrics.price_mae !== undefined && (
                          <p className="text-sm">
                            <span className="text-gray-500">MAE:</span>{' '}
                            <span className="font-semibold">{pred.metrics.price_mae.toFixed(2)}</span>
                          </p>
                        )}
                        {pred.metrics.sale_accuracy !== undefined && (
                          <p className="text-sm">
                            <span className="text-gray-500">Accuracy:</span>{' '}
                            <span className="font-semibold">{(pred.metrics.sale_accuracy * 100).toFixed(1)}%</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {pred.outputGcsObject && (
                    <div className="mt-4 pt-4 border-t">
                      <button
                        onClick={() => {
                          // In production, generate signed download URL
                          alert('Download feature coming soon');
                        }}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        Download Results
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}












