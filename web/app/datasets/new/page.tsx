'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import Link from 'next/link';

function UploadDatasetContent() {
  return (
    <AppShell title="Dataset Upload" subtitle="Uploads are disabled in this demo">
      <div className="card p-6 space-y-4 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Uploads Disabled</h1>
        <p className="text-gray-700">
          User uploads are disabled. The application uses the built-in synthetic dataset managed by the developer.
        </p>
        <div className="flex space-x-4">
          <Link href="/datasets" className="btn-primary">
            View datasets
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

export default function UploadDatasetPage() {
  return (
    <ProtectedRoute>
      <UploadDatasetContent />
    </ProtectedRoute>
  );
}





















