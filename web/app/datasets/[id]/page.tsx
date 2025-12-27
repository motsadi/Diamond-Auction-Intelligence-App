'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/instant';
import { useQuery } from '@instantdb/react';
import Link from 'next/link';

function DatasetDetailContent() {
  const params = useParams();
  const datasetId = Array.isArray(params.id) ? params.id[0] : params.id;

  // @ts-expect-error - useQuery type definition issue, works at runtime
  const { data, isLoading } = useQuery(db, {
    datasets: {
      $: { where: { id: datasetId } },
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const dataset = data?.datasets?.[0];

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Dataset not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/datasets" className="text-indigo-600 hover:underline mb-4 inline-block">
            ← Back to Datasets
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold mb-4">{dataset.name}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-semibold">
                {new Date(dataset.createdAt).toLocaleDateString()}
              </p>
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
              <p className="font-semibold text-sm">GCS</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Columns</h2>
          <div className="flex flex-wrap gap-2">
            {dataset.columns?.map((col: string) => (
              <span
                key={col}
                className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
              >
                {col}
              </span>
            ))}
          </div>
        </div>

        {dataset.notes && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className="text-gray-700">{dataset.notes}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <Link
            href={`/forecast?dataset=${datasetId}`}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Run Forecast
          </Link>
          <Link
            href={`/analysis?dataset=${datasetId}`}
            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50"
          >
            Analyze Dataset
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DatasetDetailPage() {
  return (
    <ProtectedRoute>
      <DatasetDetailContent />
    </ProtectedRoute>
  );
}

