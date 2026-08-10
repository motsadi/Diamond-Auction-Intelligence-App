'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Loader2, Play, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { STATIC_DATASET_ID, staticDataset } from '@/lib/staticDataset';

type Distribution = { count: number; mean: number; std: number; min: number; max: number };
type AnalysisResult = {
  missingness: Record<string, number>;
  distributions: Record<string, Distribution>;
  correlations: { columns: string[]; matrix: number[][] };
};

const labels: Record<string, string> = {
  carat: 'Carat weight',
  viewings: 'Buyer viewings',
  price_index: 'Market price index',
  reserve_price: 'Reserve price',
  final_price: 'Final price',
  sold: 'Sold outcome',
};

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function AnalysisContent() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datasetId: STATIC_DATASET_ID }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Data check failed');
      setResult(data);
      toast.success('Data readiness check complete');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to check auction data');
    } finally {
      setIsRunning(false);
    }
  };

  const summary = useMemo(() => {
    if (!result) return null;
    const missing = Object.values(result.missingness).reduce((total, value) => total + value, 0);
    const columns = result.correlations.columns;
    const finalPriceIndex = columns.indexOf('final_price');
    const drivers = columns
      .map((column, index) => ({
        column,
        correlation: finalPriceIndex >= 0 ? result.correlations.matrix[index][finalPriceIndex] : 0,
      }))
      .filter((item) => !['final_price', 'sold'].includes(item.column))
      .sort((left, right) => Math.abs(right.correlation) - Math.abs(left.correlation));
    return {
      missing,
      qualityScore: missing === 0 ? 100 : Math.max(0, 100 - missing / 5),
      rows: result.distributions.carat?.count || 0,
      averageReserve: result.distributions.reserve_price?.mean || 0,
      averageFinal: result.distributions.final_price?.mean || 0,
      clearance: (result.distributions.sold?.mean || 0) * 100,
      drivers,
    };
  }, [result]);

  return (
    <AppShell title="Data readiness" subtitle="Simple checks before auction modelling">
      {!result ? (
        <div className="mx-auto max-w-3xl">
          <section className="card p-7 sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Database className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">Check the auction data before forecasting</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Confirm that the working file is complete and that price, demand and lot attributes contain usable
              signals. This prevents unreliable data from reaching the pricing model.
            </p>

            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900">{staticDataset.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{staticDataset.rowCount} simulated lots · {staticDataset.columns.length} fields</div>
                </div>
                <span className="status-badge bg-blue-50 text-blue-700 ring-blue-600/20">Working data</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                Checks completeness, ranges and relationships used by the model.
              </div>
              <button type="button" onClick={runAnalysis} disabled={isRunning} className="btn-primary min-w-44">
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isRunning ? 'Checking data…' : 'Check data readiness'}
              </button>
            </div>
          </section>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Data check complete
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Auction data is ready for modelling</h1>
              <p className="mt-1 text-sm text-slate-500">Review the commercial summary before running Prediction & Demand.</p>
            </div>
            <button type="button" onClick={runAnalysis} disabled={isRunning} className="text-sm font-semibold text-slate-600 hover:text-slate-950">Check again</button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Data quality', `${summary.qualityScore.toFixed(0)}%`, summary.missing ? `${summary.missing} missing values` : 'No missing values'],
              ['Lots available', summary.rows.toLocaleString(), 'Complete working records'],
              ['Average reserve', money.format(summary.averageReserve), `Average result ${money.format(summary.averageFinal)}`],
              ['Historical clearance', `${summary.clearance.toFixed(1)}%`, 'Observed sold outcome'],
            ].map(([label, value, detail]) => (
              <div key={label} className="metric-card">
                <div className="text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
                <div className="mt-2 text-sm font-medium text-slate-700">{label}</div>
                <div className="mt-1 text-xs text-slate-400">{detail}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="card p-6">
              <h2 className="section-title">Signals linked with final price</h2>
              <p className="section-subtitle">Simple historical relationships; correlation does not prove causation.</p>
              <div className="mt-6 space-y-5">
                {summary.drivers.map((driver) => (
                  <div key={driver.column}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{labels[driver.column] || driver.column}</span>
                      <span className="font-semibold text-slate-900">{driver.correlation.toFixed(2)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${driver.correlation >= 0 ? 'bg-emerald-600' : 'bg-rose-500'}`}
                        style={{ width: `${Math.abs(driver.correlation) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 font-semibold text-emerald-950">
                  <CheckCircle2 className="h-4 w-4" /> Ready to proceed
                </div>
                <p className="mt-3 text-sm leading-6 text-emerald-900/80">
                  Required fields are complete and the dataset contains usable price and demand variation.
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 font-semibold text-amber-950">
                  <AlertTriangle className="h-4 w-4" /> Before production use
                </div>
                <p className="mt-3 text-sm leading-6 text-amber-900/80">
                  Replace simulated records with approved ODC sale data and verify grades, buyer interest and final outcomes.
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function AnalysisPage() {
  return (
    <ProtectedRoute>
      <AnalysisContent />
    </ProtectedRoute>
  );
}
