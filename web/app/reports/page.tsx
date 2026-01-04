'use client';

import { useEffect, useMemo, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import toast from 'react-hot-toast';
import { staticDataset, usDiamondsDataset, STATIC_DATASET_ID, US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

type ReportData = {
  generatedAt: string;
  datasetId: string;
  datasetName: string;
  analysis: any;
  forecast: any;
  shap: any;
};

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toTopNImportance(obj: Record<string, number> | undefined, n = 10) {
  if (!obj) return [];
  return Object.entries(obj)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, n)
    .map(([feature, importance]) => ({ feature, importance }));
}

function ReportsContent() {
  const datasets = [staticDataset, usDiamondsDataset];
  const [selectedDataset, setSelectedDataset] = useState(STATIC_DATASET_ID);
  const [modelName, setModelName] = useState('Gradient Boosting');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const selectedDs = datasets.find((ds: any) => ds.id === selectedDataset) || staticDataset;

  const priceImportance = useMemo(
    () => toTopNImportance(report?.shap?.price_importance, 12),
    [report?.shap]
  );
  const saleImportance = useMemo(
    () => toTopNImportance(report?.shap?.sale_importance, 12),
    [report?.shap]
  );

  const modelOptions =
    selectedDataset === US_DIAMONDS_DATASET_ID ? ['Ridge Regression', 'Random Forest'] : ['Gradient Boosting'];

  useEffect(() => {
    if (selectedDataset === US_DIAMONDS_DATASET_ID) {
      if (!/ridge|random\s*forest/i.test(modelName)) setModelName('Ridge Regression');
    } else {
      if (/ridge|random\s*forest/i.test(modelName)) setModelName('Gradient Boosting');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataset]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReport(null);
    try {
      const [analysisRes, forecastRes, shapRes] = await Promise.all([
        fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: selectedDataset }),
        }),
        fetch('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: selectedDataset, modelName, horizon: 1 }),
        }),
        fetch('/shap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: selectedDataset, modelName }),
        }),
      ]);

      const analysis = await analysisRes.json();
      const forecast = await forecastRes.json();
      const shap = await shapRes.json();

      if (!analysisRes.ok || !analysis?.success) throw new Error(analysis?.message || 'Analysis failed');
      if (!forecastRes.ok || !forecast?.success) throw new Error(forecast?.message || 'Forecast failed');
      if (!shapRes.ok || !shap?.success) throw new Error(shap?.message || 'Explainability failed');

      const next: ReportData = {
        generatedAt: new Date().toISOString(),
        datasetId: selectedDataset,
        datasetName: selectedDs.name,
        analysis,
        forecast,
        shap,
      };
      setReport(next);
      toast.success('Report generated');
    } catch (e: any) {
      toast.error(e?.message || 'Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadJson = () => {
    if (!report) return;
    downloadText(
      `DAI-report-${report.datasetId}-${new Date(report.generatedAt).toISOString().slice(0, 10)}.json`,
      JSON.stringify(report, null, 2),
      'application/json'
    );
  };

  const handleDownloadHtml = () => {
    if (!report) return;
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DAI Report</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 32px; color: #0f172a; }
      h1,h2 { margin: 0 0 8px; }
      .muted { color: #475569; }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
      .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #fff; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-top: 1px solid #e2e8f0; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { color: #475569; font-weight: 600; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Diamond Auction Intelligence – Report</h1>
    <div class="muted">Generated at: ${report.generatedAt}</div>
    <div class="muted">Dataset: ${report.datasetName} (${report.datasetId})</div>

    <h2 style="margin-top:20px;">Executive summary</h2>
    <div class="grid">
      <div class="card"><div class="muted">Price R²</div><div style="font-size:22px;font-weight:700;">${Number(
        report.forecast?.metrics?.price_r2 ?? 0
      ).toFixed(3)}</div></div>
      <div class="card"><div class="muted">Price MAE</div><div style="font-size:22px;font-weight:700;">${Number(
        report.forecast?.metrics?.price_mae ?? 0
      ).toFixed(2)}</div></div>
      <div class="card"><div class="muted">Sale accuracy</div><div style="font-size:22px;font-weight:700;">${(
        Number(report.forecast?.metrics?.sale_accuracy ?? 0) * 100
      ).toFixed(1)}%</div></div>
    </div>

    <h2 style="margin-top:20px;">Distributions (summary)</h2>
    <div class="card">
      <table>
        <thead>
          <tr><th>Column</th><th>Count</th><th>Mean</th><th>Std</th><th>Min</th><th>Max</th></tr>
        </thead>
        <tbody>
          ${Object.entries(report.analysis?.distributions || {})
            .map(([col, d]: any) => {
              return `<tr>
                <td><code>${col}</code></td>
                <td>${d.count}</td>
                <td>${Number(d.mean).toFixed(2)}</td>
                <td>${Number(d.std).toFixed(2)}</td>
                <td>${Number(d.min).toFixed(2)}</td>
                <td>${Number(d.max).toFixed(2)}</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  </body>
</html>`;
    downloadText(
      `DAI-report-${report.datasetId}-${new Date(report.generatedAt).toISOString().slice(0, 10)}.html`,
      html,
      'text/html'
    );
  };

  const handlePrint = () => {
    if (!report) return;
    // Use browser “Save to PDF” for the most reliable export on Vercel.
    window.print();
  };

  return (
    <AppShell
      title="Reports"
      subtitle="Generate print-ready operational reports"
      actions={
        report ? (
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={handlePrint}>
              Print / Save PDF
            </button>
            <button className="btn-secondary" onClick={handleDownloadJson}>
              Download JSON
            </button>
            <button className="btn-secondary" onClick={handleDownloadHtml}>
              Download HTML
            </button>
          </div>
        ) : null
      }
    >
      <div className="card p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">Report generation</h1>
            <p className="mt-1 text-sm text-gray-600">
              Produces an operational snapshot combining forecast metrics, analysis summaries, and feature importance.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div>
              <label className="label mb-1">Dataset</label>
              <select
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="input"
              >
                {datasets.map((ds: any) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({ds.rowCount} rows)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1">Model</label>
              <select value={modelName} onChange={(e) => setModelName(e.target.value)} className="input">
                {modelOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-primary h-10" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Generating…' : 'Generate report'}
            </button>
          </div>
        </div>
      </div>

      {report ? (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="card p-5">
              <div className="text-sm text-gray-600">Price R²</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {Number(report.forecast?.metrics?.price_r2 ?? 0).toFixed(3)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-gray-600">Price MAE</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {Number(report.forecast?.metrics?.price_mae ?? 0).toFixed(2)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-gray-600">Sale accuracy</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                {(Number(report.forecast?.metrics?.sale_accuracy ?? 0) * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900">Top price drivers</h2>
              <p className="mt-1 text-sm text-gray-600">Normalized feature importance (demo).</p>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceImportance} layout="vertical" margin={{ left: 16, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'dataMax']} />
                    <YAxis type="category" dataKey="feature" width={140} />
                    <Tooltip />
                    <Bar dataKey="importance" fill="#4f46e5" radius={[6, 6, 6, 6]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {saleImportance.length === 0 ? (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900">Secondary drivers</h2>
                <p className="mt-1 text-sm text-gray-600">
                  This dataset does not include a sale-probability model. Use the price drivers on the left.
                </p>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900">Top sale-probability drivers</h2>
                <p className="mt-1 text-sm text-gray-600">Normalized feature importance (demo).</p>
                <div className="mt-4 h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={saleImportance} layout="vertical" margin={{ left: 16, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 'dataMax']} />
                      <YAxis type="category" dataKey="feature" width={140} />
                      <Tooltip />
                      <Bar dataKey="importance" fill="#10b981" radius={[6, 6, 6, 6]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900">Dataset summary (distributions)</h2>
            <p className="mt-1 text-sm text-gray-600">Count/mean/std/min/max for key numeric columns.</p>
            <div className="mt-4 overflow-x-auto">
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
                  {Object.entries(report.analysis?.distributions || {}).map(([col, d]: any) => (
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
            <div className="mt-4 text-xs text-gray-500">
              Generated at {new Date(report.generatedAt).toLocaleString()} for dataset {report.datasetName}.
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 card p-6">
          <div className="text-sm text-gray-600">
            Select a dataset and click <span className="font-semibold text-gray-900">Generate report</span>. This will
            run analysis + forecast + explainability using the built-in demo backend.
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <ReportsContent />
    </ProtectedRoute>
  );
}


