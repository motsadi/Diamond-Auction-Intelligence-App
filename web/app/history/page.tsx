'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { db } from '@/lib/instant';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

function HistoryContent() {
  const { user } = useAuth();
  const ownerId = user?.id ?? '';
  const { data, isLoading } = db.useQuery({
    predictions: {
      $: { where: { ownerId } },
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

  const predictions = (data?.predictions || [])
    .slice()
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  const datasets = data?.datasets || [];
  const datasetMap = new Map(datasets.map((ds: any) => [ds.id, ds]));

  return (
    <AppShell title="History" subtitle="Audit trail of forecasts and outcomes">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Prediction History</h1>

      {predictions.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-600 mb-4">No predictions yet.</p>
          <Link href="/forecast" className="btn-primary">
            Run your first forecast
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {predictions.map((pred: any) => {
            const dataset = datasetMap.get(pred.datasetId);
            return (
              <div key={pred.id} className="card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1 text-gray-900">{pred.modelName} Prediction</h3>
                    <p className="text-sm text-gray-500">
                      Dataset: {dataset?.name || 'Unknown'} • {new Date(pred.createdAt).toLocaleString()}
                    </p>
                    {pred.horizon ? <p className="text-sm text-gray-500 mt-1">Horizon: {pred.horizon}</p> : null}
                  </div>
                  {pred.metrics ? (
                    <div className="sm:text-right text-sm">
                      {pred.metrics.price_r2 !== undefined ? (
                        <div>
                          <span className="text-gray-500">R²:</span>{' '}
                          <span className="font-semibold text-gray-900">{pred.metrics.price_r2.toFixed(3)}</span>
                        </div>
                      ) : null}
                      {pred.metrics.price_mae !== undefined ? (
                        <div>
                          <span className="text-gray-500">MAE:</span>{' '}
                          <span className="font-semibold text-gray-900">{pred.metrics.price_mae.toFixed(2)}</span>
                        </div>
                      ) : null}
                      {pred.metrics.sale_accuracy !== undefined ? (
                        <div>
                          <span className="text-gray-500">Accuracy:</span>{' '}
                          <span className="font-semibold text-gray-900">
                            {(pred.metrics.sale_accuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}












