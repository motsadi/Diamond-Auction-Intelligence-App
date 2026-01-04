'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import Link from 'next/link';
import { staticDataset, usDiamondsDataset, STATIC_DATASET_ID, US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';

function DatasetDetailContent() {
  const params = useParams();
  const datasetId = Array.isArray(params.id) ? params.id[0] : params.id;

  const dataset =
    datasetId === STATIC_DATASET_ID
      ? staticDataset
      : datasetId === US_DIAMONDS_DATASET_ID
      ? usDiamondsDataset
      : null;

  if (!dataset) {
    return (
      <AppShell title="Dataset">
        <div className="card p-6">
          <p className="text-gray-600">Dataset not found.</p>
          <div className="mt-4">
            <Link href="/datasets" className="btn-secondary">
              Back to datasets
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dataset" subtitle="Metadata and schema">
      <div className="mb-6">
        <Link href="/datasets" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to Datasets
        </Link>
      </div>

      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{dataset.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-semibold">{new Date(dataset.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rows</p>
            <p className="font-semibold">{dataset.rowCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Columns</p>
            <p className="font-semibold">{dataset.columns?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Storage</p>
            <p className="font-semibold text-sm">Local static dataset</p>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Columns</h2>
        <div className="flex flex-wrap gap-2">
          {dataset.columns?.map((col: string) => (
            <span key={col} className="rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 text-sm font-semibold ring-1 ring-inset ring-indigo-200">
              {col}
            </span>
          ))}
        </div>
      </div>

      {dataset.notes ? (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Notes</h2>
          <p className="text-gray-700">{dataset.notes}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Link href={dataset.downloadPath || '/api/static-dataset'} className="btn-secondary">
          Download CSV
        </Link>
        <Link href="/analysis" className="btn-secondary">
          Analyze dataset
        </Link>
      </div>
    </AppShell>
  );
}

export default function DatasetDetailPage() {
  return (
    <ProtectedRoute>
      <DatasetDetailContent />
    </ProtectedRoute>
  );
}

