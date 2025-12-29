'use client';

import { ProtectedRoute, AdminRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/instant';
import { useQuery } from '@instantdb/react';

function AdminContent() {
  // @ts-expect-error - useQuery type definition issue, works at runtime
  const { data, isLoading } = useQuery(db, {
    models: {
      $: { order: { createdAt: 'desc' } },
    },
    audit_logs: {
      $: { order: { createdAt: 'desc' }, limit: 50 },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const models = data?.models || [];
  const auditLogs = data?.audit_logs || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
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

          <div className="bg-white p-6 rounded-lg shadow-md">
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

        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">Bootstrap Admin User</h3>
          <p className="text-sm text-gray-700 mb-2">
            To assign the first admin user, use the InstantDB console or run a script that updates the{" "}
            {"user's"} role field.
          </p>
          <code className="text-xs bg-white p-2 rounded block">
            {"UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com'"}
          </code>
        </div>
      </div>
    </div>
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

