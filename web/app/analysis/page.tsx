'use client';

import { useState, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/instant';
import { useQuery } from '@instantdb/react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

function AnalysisContentInner() {
  const searchParams = useSearchParams();
  const preselectedDataset = searchParams.get('dataset');
  const { user } = useAuth();

  // @ts-expect-error - useQuery type definition issue, works at runtime
  const { data, isLoading } = useQuery(db, {
    datasets: {
      $: { where: { ownerId: user?.id || '' } },
    },
  });

  const [selectedDataset, setSelectedDataset] = useState(preselectedDataset || '');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const datasets = data?.datasets || [];

  const handleAnalyze = async () => {
    if (!selectedDataset) {
      return;
    }

    setIsAnalyzing(true);
    // In production, this would call the API to fetch analysis
    // For now, we'll show a placeholder
    setTimeout(() => {
      setAnalysisData({
        missingness: {},
        distributions: {},
        correlations: {},
      });
      setIsAnalyzing(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const selectedDs = datasets.find((ds: any) => ds.id === selectedDataset);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Exploratory Data Analysis</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dataset
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => {
                  setSelectedDataset(e.target.value);
                  setAnalysisData(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a dataset...</option>
                {datasets.map((ds: any) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({ds.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>

            {selectedDs && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Dataset:</strong> {selectedDs.name} | <strong>Rows:</strong> {selectedDs.rowCount} | <strong>Columns:</strong> {selectedDs.columns?.join(', ')}
                </p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedDataset}
              className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {analysisData && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Missing Values</h2>
              <p className="text-gray-600">
                Analysis of missing values will be displayed here. This feature requires API integration to fetch data from GCS.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Distributions</h2>
              <p className="text-gray-600">
                Distribution charts for numeric columns will be displayed here.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Correlations</h2>
              <p className="text-gray-600">
                Correlation matrix will be displayed here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <AnalysisContentInner />
    </Suspense>
  );
}

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      <AnalysisContent />
    </ProtectedRoute>
  );
}

