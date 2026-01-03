'use client';

import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { db } from '@/lib/instant';

function AdminContent() {
  const { data, isLoading } = db.useQuery({
    models: {},
    audit_logs: {},
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const models = (data?.models || [])
    .slice()
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
  const auditLogs = (data?.audit_logs || [])
    .slice()
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 50);

  return (
    <AppShell title="Admin" subtitle="Model registry and audit logs">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Model Registry</h2>
            {models.length === 0 ? (
              <p className="text-gray-500">No models registered yet.</p>
            ) : (
              <div className="space-y-4">
                {models.map((model: any) => (
                  <div key={model.id} className="border-b pb-4 last:border-0">
                    <h3 className="font-semibold">{model.name} v{model.version}</h3>
                    {model.description && (
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    )}
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Features: {model.features?.join(', ')}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(model.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
            {auditLogs.length === 0 ? (
              <p className="text-gray-500">No audit logs yet.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="text-sm border-b pb-2 last:border-0">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-gray-600">
                      {log.entityType} {log.entityId}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-blue-50 p-6">
          <h3 className="font-semibold mb-2">Bootstrap Admin User</h3>
          <p className="text-sm text-gray-700 mb-2">
            To assign the first admin user, use the InstantDB console or run a script that updates the{" "}
            {"user's"} role field.
          </p>
          <code className="text-xs bg-white p-2 rounded block">
            {"UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com'"}
          </code>
        </div>
    </AppShell>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <AdminContent />
      </AdminRoute>
    </ProtectedRoute>
  );
}

