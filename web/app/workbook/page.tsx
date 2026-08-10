'use client';

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Search,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type LotStatus = 'Draft' | 'Review' | 'Approved';

type WorkbookLot = {
  id: string;
  carat: number;
  color: string;
  clarity: string;
  viewings: number;
  priceIndex: number;
  currentReserve: number;
  referenceValue: number;
  saleChance: number;
  status: LotStatus;
  note: string;
};

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function deriveSignals(input: {
  reserve: number;
  carat: number;
  viewings: number;
  priceIndex: number;
  historicalFinal?: number;
  sold?: number;
}) {
  const demandScore = clamp(0.28 + input.viewings / 32 + (input.priceIndex - 0.8) * 0.45, 0.25, 0.97);
  const saleChance = typeof input.sold === 'number'
    ? clamp(demandScore * 0.75 + input.sold * 0.2, 0.2, 0.97)
    : demandScore;
  const scenarioEstimate = input.reserve * (0.92 + saleChance * 0.35);
  const referenceValue = input.historicalFinal && input.historicalFinal > 0
    ? input.historicalFinal
    : scenarioEstimate;
  return { referenceValue, saleChance };
}

function parseCsv(text: string): WorkbookLot[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((value) => value.trim().toLowerCase());
  const index = (names: string[]) => names.map((name) => headers.indexOf(name)).find((position) => position >= 0) ?? -1;
  const at = (parts: string[], names: string[]) => {
    const position = index(names);
    return position >= 0 ? parts[position]?.trim() : '';
  };

  return lines.slice(1, 501).map((line, rowIndex) => {
    const parts = line.split(',');
    const reserve = Number(at(parts, ['reserve_price', 'reserve', 'current_reserve'])) || 0;
    const carat = Number(at(parts, ['carat', 'carats', 'weight'])) || 0;
    const viewings = Number(at(parts, ['viewings', 'views', 'interest'])) || 0;
    const priceIndex = Number(at(parts, ['price_index', 'market_index'])) || 1;
    const historicalFinal = Number(at(parts, ['final_price', 'hammer_price'])) || undefined;
    const soldRaw = at(parts, ['sold']);
    const sold = soldRaw === '' ? undefined : Number(soldRaw);
    const signals = deriveSignals({ reserve, carat, viewings, priceIndex, historicalFinal, sold });

    return {
      id: at(parts, ['lot_id', 'lot', 'id']) || `LOT-${String(rowIndex + 1).padStart(4, '0')}`,
      carat,
      color: at(parts, ['color', 'colour']) || '—',
      clarity: at(parts, ['clarity']) || '—',
      viewings,
      priceIndex,
      currentReserve: reserve,
      referenceValue: signals.referenceValue,
      saleChance: signals.saleChance,
      status: 'Draft',
      note: '',
    };
  });
}

function escapeCsv(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function WorkbookContent() {
  const [lots, setLots] = useState<WorkbookLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [reserveRatio, setReserveRatio] = useState(82);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadDemo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/data/synthetic_auction_data.csv');
      if (!response.ok) throw new Error('Unable to load the demo workbook');
      setLots(parseCsv(await response.text()));
      toast.success('Simulated auction workbook loaded');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to load workbook');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDemo();
  }, []);

  const updateLot = (id: string, patch: Partial<WorkbookLot>) => {
    setLots((current) => current.map((lot) => (lot.id === id ? { ...lot, ...patch } : lot)));
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseCsv(await file.text());
      if (!imported.length) throw new Error('No lot rows were found in this CSV');
      setLots(imported);
      toast.success(`${imported.length} lots imported`);
    } catch (error: any) {
      toast.error(error?.message || 'CSV import failed');
    } finally {
      event.target.value = '';
    }
  };

  const summary = useMemo(() => {
    const currentReserve = lots.reduce((total, lot) => total + lot.currentReserve, 0);
    const referenceValue = lots.reduce((total, lot) => total + lot.referenceValue, 0);
    const expectedRevenue = lots.reduce((total, lot) => total + lot.referenceValue * lot.saleChance, 0);
    const exceptionCount = lots.filter((lot) => {
      const scenarioReserve = lot.referenceValue * (reserveRatio / 100);
      return Math.abs(lot.currentReserve - scenarioReserve) / Math.max(scenarioReserve, 1) > 0.12 || lot.saleChance < 0.65;
    }).length;
    return { currentReserve, referenceValue, expectedRevenue, exceptionCount };
  }, [lots, reserveRatio]);

  const visibleLots = useMemo(() => {
    const lower = query.toLowerCase();
    return lots.filter((lot) => {
      const scenarioReserve = lot.referenceValue * (reserveRatio / 100);
      const isException = Math.abs(lot.currentReserve - scenarioReserve) / Math.max(scenarioReserve, 1) > 0.12 || lot.saleChance < 0.65;
      const matches = `${lot.id} ${lot.color} ${lot.clarity} ${lot.note}`.toLowerCase().includes(lower);
      return matches && (!exceptionsOnly || isException);
    });
  }, [lots, query, exceptionsOnly, reserveRatio]);

  const applyScenarioToExceptions = () => {
    setLots((current) =>
      current.map((lot) => {
        const scenarioReserve = lot.referenceValue * (reserveRatio / 100);
        const isException = Math.abs(lot.currentReserve - scenarioReserve) / Math.max(scenarioReserve, 1) > 0.12 || lot.saleChance < 0.65;
        return isException
          ? { ...lot, currentReserve: Math.round(scenarioReserve), status: 'Review' }
          : lot;
      })
    );
    toast.success('Scenario applied to exception lots for review');
  };

  const exportCsv = () => {
    const header = [
      'lot_id', 'carat', 'color', 'clarity', 'viewings', 'price_index', 'current_reserve',
      'scenario_reserve', 'reference_value', 'sale_probability', 'status', 'review_note',
    ];
    const rows = lots.map((lot) => [
      lot.id, lot.carat, lot.color, lot.clarity, lot.viewings, lot.priceIndex, lot.currentReserve,
      Math.round(lot.referenceValue * (reserveRatio / 100)), Math.round(lot.referenceValue),
      lot.saleChance.toFixed(3), lot.status, lot.note,
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ODC-auction-workbook-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Enriched auction workbook exported');
  };

  return (
    <AppShell
      title="Auction workbook"
      subtitle="Import, review and prepare lot-level reserve decisions"
      actions={
        <button type="button" className="btn-primary" onClick={exportCsv} disabled={!lots.length}>
          <Download className="h-4 w-4" />
          Export workbook
        </button>
      }
    >
      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <FileSpreadsheet className="h-4 w-4" />
                Excel-to-auction workflow
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">One working table for every pricing decision</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Import the current CSV workbook, edit lot assumptions inline, compare reserves with a shared policy,
                record committee notes, and export the enriched file for sign-off.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" />
              <button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4" /> Import CSV
              </button>
            </div>
          </div>
        </div>

        <div className="grid border-b border-slate-200 bg-slate-50/70 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Lots in workbook', lots.length.toLocaleString(), 'Editable working set'],
            ['Current reserve total', money.format(summary.currentReserve), 'Before scenario changes'],
            ['Expected revenue', money.format(summary.expectedRevenue), 'Value × sale probability'],
            ['Exceptions', summary.exceptionCount.toLocaleString(), 'Outside policy or low demand'],
          ].map(([label, value, detail], index) => (
            <div key={label} className={`px-5 py-4 sm:px-6 ${index ? 'border-t border-slate-200 sm:border-l sm:border-t-0' : ''}`}>
              <div className="text-xs font-medium text-slate-500">{label}</div>
              <div className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{value}</div>
              <div className="mt-1 text-[11px] text-slate-400">{detail}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 border-b border-slate-200 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="reserve-ratio" className="text-sm font-semibold text-slate-800">Reserve policy</label>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">{reserveRatio}% of reference value</span>
            </div>
            <input
              id="reserve-ratio"
              type="range"
              min="65"
              max="95"
              step="1"
              value={reserveRatio}
              onChange={(event) => setReserveRatio(Number(event.target.value))}
              className="mt-4 h-2 w-full cursor-pointer accent-emerald-700"
            />
            <div className="mt-2 flex justify-between text-[11px] text-slate-400">
              <span>65% · clearance focused</span>
              <span>95% · value protection</span>
            </div>
          </div>
          <button type="button" onClick={applyScenarioToExceptions} className="btn-primary">
            Apply to {summary.exceptionCount} exceptions
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="input w-56 pl-9" placeholder="Search lot, grade or note" aria-label="Search workbook" />
            </label>
            <button type="button" onClick={() => setExceptionsOnly((value) => !value)} className={exceptionsOnly ? 'btn-primary' : 'btn-secondary'} aria-pressed={exceptionsOnly}>
              <Filter className="h-4 w-4" /> Exceptions
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Scenario estimates are not model forecasts. Use Prediction & Demand for formal scoring.
          </div>
        </div>

        <div className="max-h-[680px] overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading workbook…
            </div>
          ) : (
            <table className="min-w-[1380px] w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_#e2e8f0]">
                <tr>
                  <th className="px-4 py-3">Lot</th>
                  <th className="px-3 py-3">Carat</th>
                  <th className="px-3 py-3">Colour</th>
                  <th className="px-3 py-3">Clarity</th>
                  <th className="px-3 py-3">Viewings</th>
                  <th className="px-3 py-3">Market index</th>
                  <th className="px-3 py-3">Current reserve</th>
                  <th className="px-3 py-3">Scenario reserve</th>
                  <th className="px-3 py-3">Reference value</th>
                  <th className="px-3 py-3">Sale chance</th>
                  <th className="px-3 py-3">Decision</th>
                  <th className="px-3 py-3">Committee note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleLots.map((lot) => {
                  const scenarioReserve = Math.round(lot.referenceValue * (reserveRatio / 100));
                  const gap = (lot.currentReserve - scenarioReserve) / Math.max(scenarioReserve, 1);
                  const isException = Math.abs(gap) > 0.12 || lot.saleChance < 0.65;
                  return (
                    <tr key={lot.id} className={isException ? 'bg-amber-50/35 hover:bg-amber-50/60' : 'hover:bg-slate-50'}>
                      <td className="px-4 py-2">
                        <input value={lot.id} onChange={(event) => updateLot(lot.id, { id: event.target.value })} className="w-24 bg-transparent font-semibold text-slate-900 outline-none focus:rounded focus:bg-white focus:ring-2 focus:ring-emerald-500/30" />
                      </td>
                      <td className="px-3 py-2"><input type="number" step="0.01" value={lot.carat} onChange={(event) => updateLot(lot.id, { carat: Number(event.target.value) })} className="workbook-cell w-20" /></td>
                      <td className="px-3 py-2"><input value={lot.color} onChange={(event) => updateLot(lot.id, { color: event.target.value })} className="workbook-cell w-16 uppercase" /></td>
                      <td className="px-3 py-2"><input value={lot.clarity} onChange={(event) => updateLot(lot.id, { clarity: event.target.value })} className="workbook-cell w-20 uppercase" /></td>
                      <td className="px-3 py-2"><input type="number" value={lot.viewings} onChange={(event) => updateLot(lot.id, { viewings: Number(event.target.value) })} className="workbook-cell w-20" /></td>
                      <td className="px-3 py-2"><input type="number" step="0.01" value={lot.priceIndex} onChange={(event) => updateLot(lot.id, { priceIndex: Number(event.target.value) })} className="workbook-cell w-20" /></td>
                      <td className="px-3 py-2"><input type="number" step="10" value={Math.round(lot.currentReserve)} onChange={(event) => updateLot(lot.id, { currentReserve: Number(event.target.value) })} className="workbook-cell w-28 font-medium" /></td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="font-semibold text-slate-900">{money.format(scenarioReserve)}</div>
                        <div className={`text-[10px] font-semibold ${Math.abs(gap) > 0.12 ? 'text-amber-700' : 'text-emerald-700'}`}>{gap > 0 ? '+' : ''}{Math.round(gap * 100)}% current gap</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-700">{money.format(lot.referenceValue)}</td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold ${lot.saleChance < 0.65 ? 'text-rose-700' : 'text-slate-800'}`}>{Math.round(lot.saleChance * 100)}%</span>
                      </td>
                      <td className="px-3 py-2">
                        <select value={lot.status} onChange={(event) => updateLot(lot.id, { status: event.target.value as LotStatus })} className="workbook-cell w-24">
                          <option>Draft</option>
                          <option>Review</option>
                          <option>Approved</option>
                        </select>
                      </td>
                      <td className="px-3 py-2"><input value={lot.note} onChange={(event) => updateLot(lot.id, { note: event.target.value })} placeholder="Add rationale…" className="workbook-cell w-44" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!isLoading && !visibleLots.length ? (
            <div className="py-16 text-center text-sm text-slate-500">No lots match this view.</div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Showing {visibleLots.length} of {lots.length} lots · Up to 500 rows per CSV import</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Changes remain local until the workbook is exported
          </span>
        </div>
      </section>
    </AppShell>
  );
}

export default function WorkbookPage() {
  return (
    <ProtectedRoute>
      <WorkbookContent />
    </ProtectedRoute>
  );
}
