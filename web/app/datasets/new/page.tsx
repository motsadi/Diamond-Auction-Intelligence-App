'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

function UploadDatasetContent() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!name) {
        setName(e.target.files[0].name.replace('.csv', ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      toast.error('Please select a file and provide a name');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get signed upload URL
      const { uploadUrl, datasetId, bucket, objectKey } = await apiClient.getSignedUploadUrl(
        file.name,
        file.type
      );

      // Step 2: Upload file directly to GCS
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to GCS');
      }

      // Step 3: Register dataset in InstantDB
      await apiClient.registerDataset({
        datasetId,
        name,
        gcsBucket: bucket,
        gcsObject: objectKey,
      });

      toast.success('Dataset uploaded successfully!');
      router.push(`/datasets/${datasetId}`);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Upload Dataset</h1>

        <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter a name for this dataset"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Expected columns:</strong> carat, color, clarity, viewings, price_index
              <br />
              <strong>Optional columns:</strong> final_price, sold (for training)
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isUploading || !file || !name}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Dataset'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
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










