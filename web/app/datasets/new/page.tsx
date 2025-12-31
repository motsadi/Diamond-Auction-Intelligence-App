'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

function UploadDatasetContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Uploads Disabled</h1>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <p className="text-gray-700">
            User uploads are disabled. The application uses the built-in synthetic dataset managed
            by the developer.
          </p>
          <div className="flex space-x-4">
            <Link
              href="/datasets"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
            >
              View Dataset
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UploadDatasetPage() {
  return (
    <ProtectedRoute>
      <UploadDatasetContent />
    </ProtectedRoute>
  );
}





















