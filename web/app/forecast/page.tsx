'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Gauge,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { STATIC_DATASET_ID, staticDataset } from '@/lib/staticDataset';
import { useAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

type ForecastRow = {
  lot_id: string;
  carat: number;
  color: string;
  clarity: string;
  viewings: number;
  price_index: number;
  reserve_price: number;
  pred_price: number;
  pred_sale_proba: number;
  recommended_reserve: number;
  actual_final_price: number;
  actual_sold: number;
};

type ForecastResult = {
  predictionId: string;
  metrics: {
    price_r2: number;
    price_mae: number;
    sale_accuracy: number;
    evaluation_rows?: number;
  };
  rows: ForecastRow[];
  importance: Array<{ feature: string; value: number }>;
  csv: string;
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

function decodeForecastCsv(encoded: string): { text: string; rows: ForecastRow[] } {
  const text = atob(encoded);
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    return {
      lot_id: record.lot_id,
      carat: Number(record.carat),
      color: record.color,
      clarity: record.clarity,
      viewings: Number(record.viewings),
      price_index: Number(record.price_index),
      reserve_price: Number(record.reserve_price),
      pred_price: Number(record.pred_price),
      pred_sale_proba: Number(record.pred_sale_proba),
      recommended_reserve: Number(record.recommended_reserve),
      actual_final_price: Number(record.actual_final_price),
      actual_sold: Number(record.actual_sold),
    };
  });
  return { text, rows };
}

function ForecastContent() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [showAll, setShowAll] = useState(false);

  const runForecast = async () => {
    setIsRunning(true);
    try {
      const [forecastResponse, importanceResponse] = await Promise.all([
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
      const forecast = await forecastResponse.json();
      const drivers = await importanceResponse.json();
      if (!forecastResponse.ok || !forecast.success) throw new Error(forecast.message || 'Forecast failed');
      if (!importanceResponse.ok || !drivers.success) throw new Error(drivers.message || 'Model explanation failed');

      const decoded = decodeForecastCsv(forecast.outputCsvData);
      const importance = Object.entries(drivers.price_importance as Record<string, number>)
        .sort(([, left], [, right]) => right - left)
        .slice(0, 5)
        .map(([feature, value]) => ({ feature, value }));

      setResult({
        predictionId: forecast.predictionId,
        metrics: forecast.metrics,
        rows: decoded.rows,
        importance,
        csv: decoded.text,
      });
      toast.success('Auction forecast ready');
      if (user?.id) {
        void logActivity({
          actorId: user.id,
          action: 'forecast.run',
          entityType: 'forecast',
          entityId: forecast.predictionId,
          meta: { datasetId: STATIC_DATASET_ID, modelName: 'Interpretable auction baseline' },
        });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Unable to run forecast');
    } finally {
      setIsRunning(false);
    }
  };

  const summary = useMemo(() => {
    if (!result) return null;
    const portfolioValue = result.rows.reduce((total, row) => total + row.pred_price, 0);
    const expectedRevenue = result.rows.reduce((total, row) => total + row.pred_price * row.pred_sale_proba, 0);
    const averageSaleChance = result.rows.reduce((total, row) => total + row.pred_sale_proba, 0) / result.rows.length;
    const exceptions = result.rows
      .map((row) => ({
        ...row,
        reserveGap: (row.reserve_price - row.recommended_reserve) / Math.max(row.recommended_reserve, 1),
      }))
      .filter((row) => Math.abs(row.reserveGap) > 0.12 || row.pred_sale_proba < 0.65)
      .sort((left, right) => Math.abs(right.reserveGap) - Math.abs(left.reserveGap));
    return { portfolioValue, expectedRevenue, averageSaleChance, exceptions };
  }, [result]);

  const download = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result.csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ODC-auction-forecast-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const visibleRows = summary?.exceptions.slice(0, showAll ? 100 : 8) || [];

  return (
    <AppShell
      title="Prediction & demand"
      subtitle="Machine-learning support for lot value, sale probability and reserve review"
      actions={
        result ? (
          <button type="button" className="btn-secondary" onClick={download}>
            <Download className="h-4 w-4" />
            Export forecast
          </button>
        ) : null
      }
    >
      {!result ? (
        <div className="mx-auto max-w-4xl">
          <section className="overflow-hidden rounded-2xl bg-slate-950 p-7 text-white sm:p-9">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">Prepare the auction forecast</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Run one consistent model across the working auction portfolio. The result highlights expected value,
              clearance likelihood and lots that need a human reserve decision.
            </p>
          </section>

          <section className="mt-6 card p-6 sm:p-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Data ready</div>
                <h2 className="mt-2 text-lg font-semibold text-slate-950">{staticDataset.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{staticDataset.rowCount} simulated auction lots · 9 fields</p>
              </div>
              <span className="status-badge bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Validated
              </span>
            </div>

            <div className="mt-6 grid gap-4 border-y border-slate-200 py-6 sm:grid-cols-3">
              {[
                ['Model', 'Interpretable auction baseline', 'Lot attributes + demand signals'],
                ['Outputs', 'Value and sale likelihood', 'Plus reserve guidance'],
                ['Validation', '20% holdout sample', 'Not training-set performance'],
              ].map(([label, value, detail]) => (
                <div key={label}>
                  <div className="text-xs font-medium text-slate-500">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
                  <div className="mt-1 text-xs text-slate-400">{detail}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                Model outputs support pricing review; authorised ODC staff retain the final decision.
              </div>
              <button type="button" onClick={runForecast} disabled={isRunning} className="btn-primary min-w-44">
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isRunning ? 'Running model…' : 'Run auction forecast'}
              </button>
            </div>
          </section>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Forecast complete
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Auction decision summary</h1>
              <p className="mt-1 text-sm text-slate-500">Review the exceptions below, then export the lot-level forecast.</p>
            </div>
            <button type="button" onClick={runForecast} disabled={isRunning} className="text-sm font-semibold text-slate-600 hover:text-slate-950">
              Run again
            </button>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Expected revenue', money.format(summary.expectedRevenue), 'Value weighted by sale chance', Sparkles],
              ['Portfolio value', money.format(summary.portfolioValue), 'Model estimate before clearance', TrendingUp],
              ['Average sale chance', `${Math.round(summary.averageSaleChance * 100)}%`, 'Across all lots', Gauge],
              ['Reserve exceptions', summary.exceptions.length.toString(), 'Require human review', AlertTriangle],
            ].map(([label, value, detail, Icon]: any) => (
              <div key={label} className="metric-card">
                <Icon className="h-4 w-4 text-emerald-700" />
                <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
                <div className="mt-1 text-sm font-medium text-slate-700">{label}</div>
                <div className="mt-1 text-xs text-slate-400">{detail}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="section-title">Lots requiring reserve review</h2>
                  <p className="section-subtitle">Prioritised by reserve gap and low sale probability.</p>
                </div>
                <span className="status-badge bg-amber-50 text-amber-700 ring-amber-600/20">{summary.exceptions.length} exceptions</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Lot</th>
                      <th className="px-4 py-3">Current reserve</th>
                      <th className="px-4 py-3">Model value</th>
                      <th className="px-4 py-3">Suggested reserve</th>
                      <th className="px-4 py-3">Sale chance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleRows.map((row) => (
                      <tr key={row.lot_id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-6 py-3">
                          <div className="font-semibold text-slate-900">Lot {row.lot_id}</div>
                          <div className="text-xs text-slate-400">{row.carat.toFixed(2)} ct · {row.color} · {row.clarity} · {row.viewings} views</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">{money.format(row.reserve_price)}</td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">{money.format(row.pred_price)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="font-semibold text-emerald-800">{money.format(row.recommended_reserve)}</div>
                          <div className="text-[10px] text-slate-400">{Math.round(row.reserveGap * 100)}% current gap</div>
                        </td>
                        <td className={`whitespace-nowrap px-4 py-3 font-semibold ${row.pred_sale_proba < 0.65 ? 'text-rose-700' : 'text-slate-800'}`}>
                          {Math.round(row.pred_sale_proba * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {summary.exceptions.length > 8 ? (
                <button type="button" onClick={() => setShowAll((value) => !value)} className="flex w-full items-center justify-center gap-2 border-t border-slate-200 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  {showAll ? 'Show priority lots only' : `Show more exceptions`}
                  <ArrowRight className="h-3 w-3" />
                </button>
              ) : null}
            </div>

            <div className="space-y-6">
              <div className="card p-5">
                <h2 className="section-title">Model assurance</h2>
                <p className="section-subtitle">Performance on {result.metrics.evaluation_rows || 100} held-out lots.</p>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Typical price error</span>
                    <span className="font-semibold text-slate-900">{money.format(result.metrics.price_mae)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-500">Price variation explained</span>
                    <span className="font-semibold text-slate-900">{Math.max(0, result.metrics.price_r2 * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Sale outcome accuracy</span>
                    <span className="font-semibold text-slate-900">{(result.metrics.sale_accuracy * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h2 className="section-title">What drives value</h2>
                <p className="section-subtitle">Relative influence in the fitted price model.</p>
                <div className="mt-5 space-y-3">
                  {result.importance.map((driver) => {
                    const max = result.importance[0]?.value || 1;
                    return (
                      <div key={driver.feature}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{featureLabels[driver.feature] || driver.feature.replace(':', ' ')}</span>
                          <span className="text-slate-400">{Math.round(driver.value * 100)}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(driver.value / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}

export default function ForecastPage() {
  return (
    <ProtectedRoute>
      <ForecastContent />
    </ProtectedRoute>
  );
}
