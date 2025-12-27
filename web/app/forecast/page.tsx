'use client';

import { useState, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { db } from '@/lib/instant';
import { useQuery } from '@instantdb/react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

function ForecastContentInner() {
  const searchParams = useSearchParams();
  const preselectedDataset = searchParams.get('dataset');

  // @ts-expect-error - useQuery type definition issue, works at runtime
  const { data, isLoading } = useQuery(db, {
    datasets: {
      $: { where: { ownerId: db.auth.id() } },
    },
  });

  const [selectedDataset, setSelectedDataset] = useState(preselectedDataset || '');
  const [modelName, setModelName] = useState('Gradient Boosting');
  const [horizon, setHorizon] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  const datasets = data?.datasets || [];
  const modelOptions = ['Gradient Boosting', 'Random Forest', 'Extra Trees'];

  const handleRunForecast = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    setIsRunning(true);
    try {
      const result = await apiClient.predict({
        datasetId: selectedDataset,
        modelName,
        horizon,
      });
      setPredictionResult(result);
      toast.success('Forecast completed!');
    } catch (error: any) {
      toast.error(error.message || 'Forecast failed');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Run Forecast</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Dataset
              </label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {modelOptions.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horizon (optional)
              </label>
              <input
                type="number"
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleRunForecast}
              disabled={isRunning || !selectedDataset}
              className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isRunning ? 'Running Forecast...' : 'Run Forecast'}
            </button>
          </div>
        </div>

        {predictionResult && (
          <div className="space-y-6">
            {predictionResult.metrics && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Metrics</h2>
                <div className="grid grid-cols-3 gap-4">
                  {predictionResult.metrics.price_r2 !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Price R²</p>
                      <p className="text-2xl font-bold">{predictionResult.metrics.price_r2.toFixed(3)}</p>
                    </div>
                  )}
                  {predictionResult.metrics.price_mae !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Price MAE</p>
                      <p className="text-2xl font-bold">{predictionResult.metrics.price_mae.toFixed(2)}</p>
                    </div>
                  )}
                  {predictionResult.metrics.sale_accuracy !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Sale Accuracy</p>
                      <p className="text-2xl font-bold">{(predictionResult.metrics.sale_accuracy * 100).toFixed(1)}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {predictionResult.previewRows && predictionResult.previewRows.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(predictionResult.previewRows[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {predictionResult.previewRows.slice(0, 10).map((row: any, idx: number) => (
                        <tr key={idx}>
                          {Object.values(row).map((val: any, i: number) => (
                            <td key={i} className="px-4 py-2 text-sm text-gray-900">
                              {typeof val === 'number' ? val.toFixed(2) : val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {predictionResult.outputGcsObject && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Download Results</h2>
                <p className="text-gray-600 mb-4">
                  Full predictions are available in Google Cloud Storage.
                </p>
                <button
                  onClick={() => {
                    // In production, this would generate a signed download URL
                    toast.info('Download feature coming soon');
                  }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ForecastContent() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading...</div></div>}>
      <ForecastContentInner />
    </Suspense>
  );
}

export default function ForecastPage() {
  return (
    <ProtectedRoute>
      <ForecastContent />
    </ProtectedRoute>
  );
}

