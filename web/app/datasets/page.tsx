'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/instant';
import { useQuery } from '@instantdb/react';
import Link from 'next/link';

function DatasetsContent() {
  const { data, isLoading } = useQuery(db, {
    datasets: {
      $: { where: { ownerId: db.auth.id() } },
      $: { order: { createdAt: 'desc' } },
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Datasets</h1>
          <Link
            href="/datasets/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Upload Dataset
          </Link>
        </div>

        {datasets.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-500 mb-4">No datasets yet.</p>
            <Link
              href="/datasets/new"
              className="text-indigo-600 hover:underline font-semibold"
            >
              Upload your first dataset
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset: any) => (
              <Link
                key={dataset.id}
                href={`/datasets/${dataset.id}`}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{dataset.name}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(dataset.createdAt).toLocaleDateString()}
                </p>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Rows:</span> {dataset.rowCount}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Columns:</span> {dataset.columns?.length || 0}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DatasetsPage() {
  return (
    <ProtectedRoute>
      <DatasetsContent />
    </ProtectedRoute>
  );
}










