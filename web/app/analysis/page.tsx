'use client';

import { useState, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { useSearchParams } from 'next/navigation';
import { staticDataset, usDiamondsDataset, STATIC_DATASET_ID } from '@/lib/staticDataset';
import toast from 'react-hot-toast';

function AnalysisContentInner() {
  const searchParams = useSearchParams();
  const preselectedDataset = searchParams.get('dataset');

  const datasets = [staticDataset, usDiamondsDataset];
  const [selectedDataset, setSelectedDataset] = useState(preselectedDataset || STATIC_DATASET_ID);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedDataset) {
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: selectedDataset }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Analysis failed');
      }
      setAnalysisData(json);
      toast.success('Analysis completed');
    } catch (e: any) {
      toast.error(e?.message || 'Network error');
      setAnalysisData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedDs = datasets.find((ds: any) => ds.id === selectedDataset);
  const analysisQuestions = [
    'Which auction variables have enough quality and coverage to trust in a model?',
    'Which price, demand, and quality indicators move together before forecasting?',
    'Where do missing values or outliers create model risk for reserve-price decisions?',
  ];

  return (
    <AppShell title="Analysis" subtitle="Data quality, econometric diagnostics, and auction signal review">
      <div className="mb-6 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="text-sm font-semibold text-indigo-700">Pre-model econometric diagnostics</div>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">Exploratory Data Analysis</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Check data quality, distributions, and correlations before training auction forecasts. This makes the model
              story clearer: we are not only predicting, we are validating the economic signals behind the auction outcome.
            </p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900">Questions this screen should answer</div>
            <div className="mt-3 space-y-2">
              {analysisQuestions.map((question) => (
                <div key={question} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {question}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        <div className="card p-6 mb-6">
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
              className="btn-primary w-full"
            >
              {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        </div>

        {analysisData && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Missing Values</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-6">Column</th>
                      <th className="py-2">Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analysisData.missingness || {}).map(([col, count]: any) => (
                      <tr key={col} className="border-t">
                        <td className="py-2 pr-6 font-medium text-gray-900">{col}</td>
                        <td className="py-2 text-gray-700">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Distributions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-6">Column</th>
                      <th className="py-2 pr-6">Count</th>
                      <th className="py-2 pr-6">Mean</th>
                      <th className="py-2 pr-6">Std</th>
                      <th className="py-2 pr-6">Min</th>
                      <th className="py-2">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analysisData.distributions || {}).map(([col, d]: any) => (
                      <tr key={col} className="border-t">
                        <td className="py-2 pr-6 font-medium text-gray-900">{col}</td>
                        <td className="py-2 pr-6 text-gray-700">{d.count}</td>
                        <td className="py-2 pr-6 text-gray-700">{Number(d.mean).toFixed(2)}</td>
                        <td className="py-2 pr-6 text-gray-700">{Number(d.std).toFixed(2)}</td>
                        <td className="py-2 pr-6 text-gray-700">{Number(d.min).toFixed(2)}</td>
                        <td className="py-2 text-gray-700">{Number(d.max).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Correlations</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="py-2 pr-4 text-left text-gray-500"> </th>
                      {(analysisData.correlations?.columns || []).map((c: string) => (
                        <th key={c} className="py-2 px-2 text-left text-gray-500 whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(analysisData.correlations?.columns || []).map((rowName: string, i: number) => (
                      <tr key={rowName} className="border-t">
                        <td className="py-2 pr-4 font-medium text-gray-900 whitespace-nowrap">{rowName}</td>
                        {(analysisData.correlations?.matrix?.[i] || []).map((v: number, j: number) => (
                          <td key={`${i}-${j}`} className="py-2 px-2 text-gray-700">
                            {Number(v).toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
    </AppShell>
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

