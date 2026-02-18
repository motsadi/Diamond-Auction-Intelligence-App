'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { db } from '@/lib/instant';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

function formatActivityAction(action: string) {
  const map: Record<string, string> = {
    'auth.sign_in': 'Signed in',
    'auth.sign_out': 'Signed out',
    'page.view': 'Viewed page',
    'forecast.run': 'Ran forecast',
    'predict.single': 'Ran single prediction',
    'optimize.run': 'Ran optimisation',
    'surface.compute': 'Computed solution surface',
    'shap.compute': 'Computed SHAP explainability',
    'report.generate': 'Generated report',
  };
  return map[action] || action;
}

function DashboardContent() {
  const { user, isAdmin } = useAuth();
  const ownerId = user?.id ?? '';
  const auditLogsQuery = isAdmin ? {} : { $: { where: { actorId: ownerId } } };
  const usersQuery = isAdmin ? {} : { $: { where: { id: ownerId } } };

  // Note: call hooks unconditionally (no conditional `useQuery`).
  const { data, isLoading } = db.useQuery({
    datasets: {
      $: { where: { ownerId } },
    },
    predictions: {
      $: { where: { ownerId } },
    },
    audit_logs: auditLogsQuery,
    users: usersQuery,
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
  const recentActivity = (data?.audit_logs || [])
    .slice()
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 10);
  const users = data?.users || [];
  const emailById = new Map(users.map((u: any) => [u.id, u.email]));
  const latestActivity = recentActivity[0];

  return (
    <AppShell title="Overview" subtitle="Operational snapshot and quick links">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600">Auction operations</div>
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
            <p className="text-3xl font-bold text-indigo-600">{latestActivity ? 'Active' : 'None'}</p>
            {latestActivity ? (
              <div className="mt-2 text-sm text-gray-600">
                <div className="font-medium text-gray-900">{formatActivityAction(latestActivity.action)}</div>
                <div className="text-xs text-gray-500">
                  {new Date(latestActivity.createdAt).toLocaleString()}
                </div>
              </div>
            ) : null}
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

        <div className="mt-8 card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {isAdmin ? (
              <Link href="/admin" className="text-indigo-600 hover:underline text-sm">
                View audit logs
              </Link>
            ) : null}
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500">No recent activity yet.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {recentActivity.map((log: any) => {
                const actorEmail = emailById.get(log.actorId) || (log.meta?.email as string | undefined);
                const actorLabel = isAdmin ? actorEmail || log.actorId : 'You';
                const host = log.meta?.host as string | undefined;
                return (
                  <div key={log.id} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="font-medium text-gray-900">
                        {formatActivityAction(log.action)}{' '}
                        <span className="font-normal text-gray-600">• {actorLabel}</span>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.entityType}: {log.entityId}
                      {host ? ` • ${host}` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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












