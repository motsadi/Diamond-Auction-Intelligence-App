'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, FileBarChart, Loader2, Play, Printer, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { STATIC_DATASET_ID, staticDataset } from '@/lib/staticDataset';
import { useAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

type Report = {
  generatedAt: string;
  analysis: any;
  forecast: any;
  importance: any;
};

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const featureLabels: Record<string, string> = {
  carat: 'Carat weight',
  viewings: 'Buyer viewings',
  price_index: 'Market price index',
  'color:D': 'Colour D',
  'color:E': 'Colour E',
  'color:F': 'Colour F',
  'color:G': 'Colour G',
  'color:H': 'Colour H',
  'color:I': 'Colour I',
  'color:J': 'Colour J',
};

function decodeRows(encoded: string) {
  const lines = atob(encoded).trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function ReportsContent() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const [analysisResponse, forecastResponse, importanceResponse] = await Promise.all([
        fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: STATIC_DATASET_ID }),
        }),
        fetch('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: STATIC_DATASET_ID, modelName: 'Interpretable auction baseline' }),
        }),
        fetch('/shap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ datasetId: STATIC_DATASET_ID, modelName: 'Interpretable auction baseline' }),
        }),
      ]);
      const [analysis, forecast, importance] = await Promise.all([
        analysisResponse.json(),
        forecastResponse.json(),
        importanceResponse.json(),
      ]);
      if (!analysisResponse.ok || !analysis.success) throw new Error(analysis.message || 'Data analysis failed');
      if (!forecastResponse.ok || !forecast.success) throw new Error(forecast.message || 'Forecast failed');
      if (!importanceResponse.ok || !importance.success) throw new Error(importance.message || 'Model explanation failed');

      const generatedAt = new Date().toISOString();
      setReport({ generatedAt, analysis, forecast, importance });
      toast.success('Decision report ready');
      if (user?.id) {
        void logActivity({
          actorId: user.id,
          action: 'report.generate',
          entityType: 'report',
          entityId: STATIC_DATASET_ID,
          meta: { datasetName: staticDataset.name, modelName: 'Interpretable auction baseline' },
        });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Unable to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const summary = useMemo(() => {
    if (!report) return null;
    const rows = decodeRows(report.forecast.outputCsvData);
    const expectedRevenue = rows.reduce(
      (total, row) => total + Number(row.pred_price) * Number(row.pred_sale_proba),
      0
    );
    const averageSaleChance = rows.reduce((total, row) => total + Number(row.pred_sale_proba), 0) / rows.length;
    const exceptions = rows.filter((row) => {
      const current = Number(row.reserve_price);
      const recommended = Number(row.recommended_reserve);
      return Math.abs(current - recommended) / Math.max(recommended, 1) > 0.12 || Number(row.pred_sale_proba) < 0.65;
    }).length;
    const drivers = Object.entries(report.importance.price_importance as Record<string, number>)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5)
      .map(([feature, value]) => ({ feature, value }));
    return { rows, expectedRevenue, averageSaleChance, exceptions, drivers };
  }, [report]);

  return (
    <AppShell
      title="Auction report"
      subtitle="A concise decision pack for pricing review and management"
      actions={
        report ? (
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        ) : null
      }
    >
      {!report ? (
        <div className="mx-auto max-w-3xl">
          <section className="card p-7 sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <FileBarChart className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">Create the auction decision report</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Produce one consistent summary of data readiness, machine-learning performance, portfolio outlook,
              reserve exceptions and the main value drivers.
            </p>
            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="font-semibold text-slate-900">Report scope</div>
              <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <span>• {staticDataset.rowCount} auction lots</span>
                <span>• Holdout model validation</span>
                <span>• Reserve exception summary</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-700" />
                Results remain advisory and are labelled as simulated.
              </div>
              <button type="button" onClick={generateReport} disabled={isGenerating} className="btn-primary min-w-44">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isGenerating ? 'Generating…' : 'Generate report'}
              </button>
            </div>
          </section>
        </div>
      ) : summary ? (
        <article className="space-y-6">
          <header className="card p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-emerald-700">Okavango Diamond Company</div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Pre-auction decision report</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Simulated portfolio · Generated {new Date(report.generatedAt).toLocaleString()}
                </p>
              </div>
              <span className="status-badge bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Model complete
              </span>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Expected revenue', money.format(summary.expectedRevenue), 'Value weighted by sale chance'],
              ['Expected clearance', `${Math.round(summary.averageSaleChance * 100)}%`, `Across ${summary.rows.length} lots`],
              ['Reserve exceptions', summary.exceptions.toString(), 'Require pricing review'],
              ['Typical price error', money.format(report.forecast.metrics.price_mae), `${report.forecast.metrics.evaluation_rows || 100} held-out lots`],
            ].map(([label, value, detail]) => (
              <div key={label} className="metric-card">
                <div className="text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
                <div className="mt-2 text-sm font-medium text-slate-700">{label}</div>
                <div className="mt-1 text-xs text-slate-400">{detail}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="card p-6">
              <h2 className="section-title">Management interpretation</h2>
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                <p>
                  The model estimates {money.format(summary.expectedRevenue)} in clearance-adjusted portfolio revenue.
                  {summary.exceptions} lots fall outside the current reserve policy tolerance or have lower demand confidence.
                </p>
                <p>
                  Review exceptions individually in the auction workbook. Do not apply a portfolio-wide reserve change
                  without considering current buyer interest, grading evidence and comparable market outcomes.
                </p>
                <p>
                  The typical holdout error is {money.format(report.forecast.metrics.price_mae)}. This uncertainty should
                  be reflected in committee judgement, particularly for unusual or high-value lots.
                </p>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="section-title">Main value drivers</h2>
              <p className="section-subtitle">Relative influence in the fitted model.</p>
              <div className="mt-5 space-y-4">
                {summary.drivers.map((driver) => {
                  const max = summary.drivers[0]?.value || 1;
                  return (
                    <div key={driver.feature}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{featureLabels[driver.feature] || driver.feature.replace(':', ' ')}</span>
                        <span className="text-slate-400">{Math.round(driver.value * 100)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-violet-600" style={{ width: `${(driver.value / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <footer className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-xs leading-5 text-amber-900">
            This demonstration uses simulated data. Production decisions require approved ODC auction records, authorised
            pricing review and documented committee sign-off.
          </footer>
        </article>
      ) : null}
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
