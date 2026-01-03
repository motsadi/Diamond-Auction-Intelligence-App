'use client';

import { useState, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { apiClient, OptimizeRequest, SurfaceRequest, ShapRequest } from '@/lib/api';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { staticDataset, STATIC_DATASET_ID } from '@/lib/staticDataset';
import type { PlotParams } from 'react-plotly.js';

const Plot = dynamic<PlotParams>(
  () => import('react-plotly.js').then((mod) => mod.default),
  { ssr: false }
);

function ForecastContentInner() {
  const searchParams = useSearchParams();
  const preselectedDataset = searchParams.get('dataset');

  const datasets = [staticDataset];
  const [selectedDataset, setSelectedDataset] = useState(preselectedDataset || STATIC_DATASET_ID);
  const [modelName, setModelName] = useState('Gradient Boosting');
  const [horizon, setHorizon] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const modelOptions = ['Gradient Boosting', 'Random Forest', 'Extra Trees'];

  // Single-lot prediction state
  const [singleCarat, setSingleCarat] = useState(1.0);
  const [singleColor, setSingleColor] = useState('G');
  const [singleClarity, setSingleClarity] = useState('VS1');
  const [singleViewings, setSingleViewings] = useState(10);
  const [singlePriceIndex, setSinglePriceIndex] = useState(1.0);
  const [singlePrediction, setSinglePrediction] = useState<any>(null);
  const [isPredictingSingle, setIsPredictingSingle] = useState(false);

  // Valid options from dataset (for static dataset)
  const colorOptions = ['D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const clarityOptions = ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1'];

  // Optimization state
  const [fixedColorOpt, setFixedColorOpt] = useState('G');
  const [fixedClarityOpt, setFixedClarityOpt] = useState('VS1');
  const [optObjective, setOptObjective] = useState<'max_price' | 'max_prob' | 'target'>('max_price');
  const [minProb, setMinProb] = useState(0.5);
  const [nSamples, setNSamples] = useState(1000);
  const [targetPrice, setTargetPrice] = useState(5000);
  const [targetProb, setTargetProb] = useState(0.8);
  const [optResult, setOptResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Surface state
  const [surfaceVarX, setSurfaceVarX] = useState('carat');
  const [surfaceVarY, setSurfaceVarY] = useState('viewings');
  const [surfaceMetric, setSurfaceMetric] = useState<'Final Price' | 'Sale Probability' | 'Expected Revenue'>('Final Price');
  const [surfaceResolution, setSurfaceResolution] = useState(25);
  const [surfaceData, setSurfaceData] = useState<any>(null);
  const [isComputingSurface, setIsComputingSurface] = useState(false);
  const continuousVars = ['carat', 'viewings', 'price_index'];

  // SHAP state
  const [shapData, setShapData] = useState<any>(null);
  const [isComputingShap, setIsComputingShap] = useState(false);

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

  const handleSinglePredict = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    setIsPredictingSingle(true);
    try {
      const result = await apiClient.predictSingle({
        datasetId: selectedDataset,
        modelName,
        carat: singleCarat,
        color: singleColor,
        clarity: singleClarity,
        viewings: singleViewings,
        price_index: singlePriceIndex,
      });
      setSinglePrediction(result);
      toast.success('Prediction completed!');
    } catch (error: any) {
      toast.error(error.message || 'Prediction failed');
    } finally {
      setIsPredictingSingle(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    setIsOptimizing(true);
    try {
      const request: OptimizeRequest = {
        datasetId: selectedDataset,
        modelName,
        objective: optObjective,
        n_samples: nSamples,
        fixed_color: fixedColorOpt,
        fixed_clarity: fixedClarityOpt,
      };

      if (optObjective === 'max_price') {
        request.min_prob = minProb;
      } else if (optObjective === 'target') {
        request.target_price = targetPrice;
        request.target_prob = targetProb;
      }

      const result = await apiClient.optimize(request);
      if (result.success && result.result) {
        setOptResult(result.result);
        toast.success('Optimization completed!');
      } else {
        toast.error(result.message || 'Optimization failed - no feasible solution found');
        setOptResult(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Optimization failed');
      setOptResult(null);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleComputeSurface = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    setIsComputingSurface(true);
    try {
      const request: SurfaceRequest = {
        datasetId: selectedDataset,
        modelName,
        var_x: surfaceVarX,
        var_y: surfaceVarY,
        metric: surfaceMetric,
        n_points: surfaceResolution,
        fixed_color: fixedColorOpt,
        fixed_clarity: fixedClarityOpt,
      };

      const result = await apiClient.surface(request);
      if (result.success) {
        setSurfaceData(result);
        toast.success('Surface computation completed!');
      } else {
        toast.error('Surface computation failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Surface computation failed');
    } finally {
      setIsComputingSurface(false);
    }
  };

  const handleComputeShap = async () => {
    if (!selectedDataset) {
      toast.error('Please select a dataset');
      return;
    }

    setIsComputingShap(true);
    try {
      const request: ShapRequest = {
        datasetId: selectedDataset,
        modelName,
      };

      const result = await apiClient.shap(request);
      if (result.success) {
        setShapData(result);
        toast.success('SHAP analysis completed!');
      } else {
        toast.error('SHAP analysis failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'SHAP analysis failed');
    } finally {
      setIsComputingShap(false);
    }
  };

  return (
    <AppShell
      title="Prediction & Demand Forecasting"
      subtitle="Forecasts, optimization, solution surfaces, and explainability"
    >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Prediction & Demand Forecasting</h1>

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

        {/* Single-lot prediction section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Predict and Recommend</h2>
          <p className="text-gray-600 mb-4">
            Enter details about a new diamond lot to get price prediction, sale probability, and recommended reserve price.
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carat weight
                </label>
                <input
                  type="number"
                  value={singleCarat}
                  onChange={(e) => setSingleCarat(parseFloat(e.target.value) || 0)}
                  min="0.1"
                  max="10.0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colour grade
                </label>
                <select
                  value={singleColor}
                  onChange={(e) => setSingleColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {colorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clarity grade
                </label>
                <select
                  value={singleClarity}
                  onChange={(e) => setSingleClarity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {clarityOptions.map((clarity) => (
                    <option key={clarity} value={clarity}>
                      {clarity}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of viewings
                </label>
                <input
                  type="number"
                  value={singleViewings}
                  onChange={(e) => setSingleViewings(parseInt(e.target.value) || 0)}
                  min="0"
                  max="50"
                  step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price index
                </label>
                <input
                  type="number"
                  value={singlePriceIndex}
                  onChange={(e) => setSinglePriceIndex(parseFloat(e.target.value) || 0)}
                  min="0.5"
                  max="2.0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handleSinglePredict}
              disabled={isPredictingSingle || !selectedDataset}
              className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPredictingSingle ? 'Predicting...' : 'Predict'}
            </button>
          </div>

          {singlePrediction && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-lg font-semibold mb-3">Prediction Results</h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-semibold">Predicted final price:</span>{' '}
                  ${singlePrediction.pred_price.toFixed(2)}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Predicted sale probability:</span>{' '}
                  {(singlePrediction.pred_sale_proba * 100).toFixed(1)}%
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Recommended reserve price:</span>{' '}
                  ${singlePrediction.recommended_reserve.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Batch predictions section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Batch Predictions</h2>
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

            {(predictionResult.outputGcsObject || predictionResult.outputCsvData) && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Download Results</h2>
                <p className="text-gray-600 mb-4">
                  Download the full predictions as a CSV file.
                </p>
                <button
                  onClick={async () => {
                    try {
                      if (predictionResult.outputCsvData) {
                        // Handle base64 CSV data (static dataset)
                        const binaryString = atob(predictionResult.outputCsvData);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                          bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `predictions_${predictionResult.predictionId}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        toast.success('Download started');
                      } else if (predictionResult.outputGcsObject && predictionResult.predictionId) {
                        // Handle GCS download
                        const blob = await apiClient.downloadPrediction(predictionResult.predictionId);
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `predictions_${predictionResult.predictionId}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        toast.success('Download started');
                      }
                    } catch (error: any) {
                      toast.error(error.message || 'Download failed');
                    }
                  }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Download CSV
                </button>
              </div>
            )}
          </div>
        )}

        {/* Optimization & Solution Surfaces Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Optimisation & Solution Surfaces</h2>
          <p className="text-gray-600 mb-6">
            Work backwards from a desired outcome or explore how two features influence price, sale probability or expected revenue.
          </p>

          {/* Fixed Categorical Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Fixed Categorical Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select colour grade
                </label>
                <select
                  value={fixedColorOpt}
                  onChange={(e) => setFixedColorOpt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {colorOptions.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select clarity grade
                </label>
                <select
                  value={fixedClarityOpt}
                  onChange={(e) => setFixedClarityOpt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {clarityOptions.map((clarity) => (
                    <option key={clarity} value={clarity}>
                      {clarity}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 mt-6">
            {/* Goal Seeking / Optimization */}
            <h3 className="text-lg font-semibold mb-4">Goal Seeking / Optimisation</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimisation objective
                </label>
                <select
                  value={optObjective}
                  onChange={(e) => setOptObjective(e.target.value as 'max_price' | 'max_prob' | 'target')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="max_price">Maximise Final Price</option>
                  <option value="max_prob">Maximise Sale Probability</option>
                  <option value="target">Match Target Price & Sale Probability</option>
                </select>
              </div>

              {optObjective === 'max_price' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum acceptable sale probability: {minProb.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={minProb}
                      onChange={(e) => setMinProb(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of random samples
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      step="100"
                      value={nSamples}
                      onChange={(e) => setNSamples(parseInt(e.target.value) || 1000)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {optObjective === 'max_prob' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of random samples
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="100"
                    value={nSamples}
                    onChange={(e) => setNSamples(parseInt(e.target.value) || 1000)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {optObjective === 'target' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target final price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target sale probability: {targetProb.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={targetProb}
                      onChange={(e) => setTargetProb(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of random samples
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      step="100"
                      value={nSamples}
                      onChange={(e) => setNSamples(parseInt(e.target.value) || 2000)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleOptimize}
                disabled={isOptimizing || !selectedDataset}
                className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isOptimizing ? 'Searching for optimal conditions...' : 'Run optimisation'}
              </button>
            </div>

            {optResult && (
              <div className="mt-6 p-4 bg-green-50 rounded-md">
                <h4 className="text-lg font-semibold mb-3">Best conditions found!</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Carat</p>
                    <p className="font-semibold">{optResult.carat.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Viewings</p>
                    <p className="font-semibold">{optResult.viewings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Price Index</p>
                    <p className="font-semibold">{optResult.price_index.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Colour</p>
                    <p className="font-semibold">{optResult.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Clarity</p>
                    <p className="font-semibold">{optResult.clarity}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-semibold">Predicted final price:</span>{' '}
                    ${optResult.pred_price.toFixed(2)}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Predicted sale probability:</span>{' '}
                    {(optResult.pred_prob * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-6 mt-6">
            {/* 3D Solution Surfaces */}
            <h3 className="text-lg font-semibold mb-4">3D Solution Surfaces</h3>
            <p className="text-gray-600 mb-4">
              Select two variables to explore how the response changes across their range. You can choose to view the predicted final price, sale probability or expected revenue (price × probability).
            </p>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X‑axis variable
                  </label>
                  <select
                    value={surfaceVarX}
                    onChange={(e) => setSurfaceVarX(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {continuousVars.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Y‑axis variable
                  </label>
                  <select
                    value={surfaceVarY}
                    onChange={(e) => setSurfaceVarY(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {continuousVars.filter((v) => v !== surfaceVarX).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metric to display
                </label>
                <select
                  value={surfaceMetric}
                  onChange={(e) => setSurfaceMetric(e.target.value as 'Final Price' | 'Sale Probability' | 'Expected Revenue')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Final Price">Final Price</option>
                  <option value="Sale Probability">Sale Probability</option>
                  <option value="Expected Revenue">Expected Revenue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surface resolution: {surfaceResolution}
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={surfaceResolution}
                  onChange={(e) => setSurfaceResolution(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleComputeSurface}
                disabled={isComputingSurface || !selectedDataset}
                className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isComputingSurface ? 'Computing surface...' : 'Generate surface'}
              </button>
            </div>

            {surfaceData && (
              <div className="mt-6">
                <Plot
                  data={[
                    {
                      type: 'surface',
                      x: surfaceData.x_grid,
                      y: surfaceData.y_grid,
                      z: surfaceData.z_values,
                      colorscale: 'Viridis',
                      showscale: true,
                    },
                  ]}
                  layout={{
                    title: `${surfaceMetric} Surface: ${surfaceVarX} vs ${surfaceVarY}`,
                    scene: {
                      xaxis: { title: surfaceVarX },
                      yaxis: { title: surfaceVarY },
                      zaxis: { title: surfaceMetric },
                    },
                    autosize: true,
                    height: 600,
                  }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* SHAP Explainability Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Model Explainability (SHAP)</h2>
          <p className="text-gray-600 mb-4">
            Understand which features are most important for predicting price and sale probability using SHAP (SHapley Additive exPlanations) values.
          </p>
          <button
            onClick={handleComputeShap}
            disabled={isComputingShap || !selectedDataset}
            className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 mb-6"
          >
            {isComputingShap ? 'Computing SHAP values...' : 'Compute Feature Importance'}
          </button>

          {shapData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Model Feature Importance */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Price Model Feature Importance</h3>
                <div className="space-y-3">
                  {Object.entries(shapData.price_importance)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([feature, importance]) => (
                      <div key={feature}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{feature}</span>
                          <span className="text-sm text-gray-600">{(importance as number).toFixed(4)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: `${((importance as number) / Math.max(...Object.values(shapData.price_importance) as number[]) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Sale Model Feature Importance */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Sale Probability Model Feature Importance</h3>
                <div className="space-y-3">
                  {Object.entries(shapData.sale_importance)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([feature, importance]) => (
                      <div key={feature}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{feature}</span>
                          <span className="text-sm text-gray-600">{(importance as number).toFixed(4)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${((importance as number) / Math.max(...Object.values(shapData.sale_importance) as number[]) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
    </AppShell>
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

