'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileBarChart,
  Gauge,
  Gem,
  Info,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth';

type Lot = {
  id: string;
  description: string;
  carats: number;
  interest: number;
  reserve: number;
  forecast: number;
  probability: number;
  status: 'Review' | 'Ready' | 'Watch';
};

const lots: Lot[] = [
  { id: 'ODC-0421', description: 'D / VS1 · Mixed parcel', carats: 3.79, interest: 13, reserve: 3455, forecast: 5230, probability: 0.91, status: 'Ready' },
  { id: 'ODC-0438', description: 'J / VVS2 · Mixed parcel', carats: 4.78, interest: 16, reserve: 4473, forecast: 6118, probability: 0.87, status: 'Ready' },
  { id: 'ODC-0444', description: 'D / VS1 · Mixed parcel', carats: 3.19, interest: 23, reserve: 3079, forecast: 5190, probability: 0.95, status: 'Review' },
  { id: 'ODC-0459', description: 'D / VVS1 · Mixed parcel', carats: 1.2, interest: 2, reserve: 1263, forecast: 1529, probability: 0.58, status: 'Watch' },
  { id: 'ODC-0467', description: 'G / VVS2 · Mixed parcel', carats: 0.76, interest: 12, reserve: 767, forecast: 1241, probability: 0.82, status: 'Ready' },
];

const workflow = [
  { label: 'Import & validate', detail: 'Auction workbook checked', done: true },
  { label: 'Value & forecast', detail: '500 lots scored', done: true },
  { label: 'Reserve review', detail: '18 exceptions to review', done: false },
  { label: 'Committee approval', detail: 'Awaiting sign-off', done: false },
  { label: 'Auction & report', detail: 'Opens after approval', done: false },
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function StatusBadge({ status }: { status: Lot['status'] }) {
  const style =
    status === 'Ready'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
      : status === 'Review'
        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
        : 'bg-rose-50 text-rose-700 ring-rose-600/20';
  return <span className={`status-badge ${style}`}>{status}</span>;
}

function DashboardContent() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [riskOnly, setRiskOnly] = useState(false);

  const visibleLots = useMemo(() => {
    return lots.filter((lot) => {
      const matchesQuery = `${lot.id} ${lot.description}`.toLowerCase().includes(query.toLowerCase());
      return matchesQuery && (!riskOnly || lot.status !== 'Ready');
    });
  }, [query, riskOnly]);

  const firstName = user?.email?.split('@')[0]?.split('.')[0] || 'auction team';

  return (
    <AppShell
      title="Auction command centre"
      subtitle="Cycle 08 · August 2026"
      actions={
        <Link href="/reports" className="btn-primary">
          <FileBarChart className="h-4 w-4" />
          Create report
        </Link>
      }
    >
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-[0_24px_60px_-32px_rgba(15,23,42,0.7)] sm:px-8">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative grid gap-7 xl:grid-cols-[1fr_400px] xl:items-end">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Pre-auction review in progress
              </span>
              <span className="text-xs text-slate-400">Simulated auction data</span>
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              Good afternoon, <span className="capitalize">{firstName}</span>.
              <br />
              <span className="text-slate-400">18 lots need a pricing decision.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              Review model exceptions, confirm reserves, and prepare the committee pack for the next ODC sale cycle.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/workbook" className="group rounded-xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/10">
              <Target className="h-5 w-5 text-emerald-300" />
              <div className="mt-5 text-sm font-semibold">Review reserves</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                Open workbook <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
            <Link href="/copilot" className="group rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 transition hover:bg-emerald-300/15">
              <Sparkles className="h-5 w-5 text-emerald-300" />
              <div className="mt-5 text-sm font-semibold">Ask auction AI</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-emerald-100/70">
                Build a decision brief <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Forecast revenue', value: '$1.64m', change: '+7.8% vs reserve', icon: CircleDollarSign, tone: 'text-emerald-700 bg-emerald-50' },
          { label: 'Expected clearance', value: '89.6%', change: '448 of 500 lots', icon: Gauge, tone: 'text-blue-700 bg-blue-50' },
          { label: 'Lots needing review', value: '18', change: '3 high-priority', icon: ShieldCheck, tone: 'text-amber-700 bg-amber-50' },
          { label: 'Registered buyers', value: '42', change: '6 high-intent', icon: Users, tone: 'text-violet-700 bg-violet-50' },
        ].map((metric) => (
          <div key={metric.label} className="metric-card">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${metric.tone}`}>
              <metric.icon className="h-4 w-4" />
            </div>
            <div className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{metric.value}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">{metric.label}</div>
            <div className="mt-1 text-xs text-slate-500">{metric.change}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="section-title">Reserve review queue</h2>
                <p className="section-subtitle">Prioritised by value gap, demand and sale probability.</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find lot"
                    className="input w-40 pl-9"
                    aria-label="Find lot"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setRiskOnly((value) => !value)}
                  className={riskOnly ? 'btn-primary' : 'btn-secondary'}
                  aria-pressed={riskOnly}
                >
                  Exceptions
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Lot</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Reserve</th>
                  <th className="px-4 py-3">Forecast</th>
                  <th className="px-4 py-3">Sale chance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleLots.map((lot) => (
                  <tr key={lot.id} className="group transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-semibold text-slate-900">{lot.id}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{lot.carats.toFixed(2)} ct · {lot.description}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{lot.interest}</span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, lot.interest * 4)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-700">{currency.format(lot.reserve)}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="font-semibold text-slate-950">{currency.format(lot.forecast)}</div>
                      <div className="text-xs font-medium text-emerald-700">+{Math.round((lot.forecast / lot.reserve - 1) * 100)}%</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-800">{Math.round(lot.probability * 100)}%</span>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={lot.status} /></td>
                    <td className="px-4 py-4">
                      <Link href="/forecast" aria-label={`Review ${lot.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-900 hover:shadow-sm">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleLots.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">No lots match this view.</div>
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-6 py-3">
            <span className="text-xs text-slate-500">Showing {visibleLots.length} priority lots from the simulated portfolio</span>
            <Link href="/forecast" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">Review all 500 lots →</Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Auction cycle</h2>
                <p className="section-subtitle">One shared path from Excel to sale.</p>
              </div>
              <span className="status-badge bg-blue-50 text-blue-700 ring-blue-600/20">40%</span>
            </div>
            <div className="mt-5 space-y-1">
              {workflow.map((step, index) => (
                <div key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < workflow.length - 1 ? <div className={`absolute left-[13px] top-7 h-full w-px ${step.done ? 'bg-emerald-300' : 'bg-slate-200'}`} /> : null}
                  <div className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${step.done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                    {step.done ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
                  </div>
                  <div className="pt-0.5">
                    <div className={`text-sm font-semibold ${index === 2 ? 'text-amber-700' : 'text-slate-800'}`}>{step.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{step.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/70">
            <div className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
                <Bot className="h-4 w-4" />
                AI auction brief
              </div>
              <p className="mt-3 text-sm leading-6 text-emerald-950/75">
                Demand is strongest in lots above 3 ct. Review low-viewing lot ODC-0459 before approval; its clearance confidence is below the portfolio threshold.
              </p>
              <div className="mt-4 rounded-lg border border-emerald-200 bg-white/70 p-3 text-xs leading-5 text-emerald-900">
                <Info className="mr-1 inline h-3.5 w-3.5" />
                Grounded in the simulated lot forecast. Human approval remains required.
              </div>
            </div>
            <Link href="/copilot" className="flex items-center justify-between border-t border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100/60">
              Open Auction Copilot <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="section-title">Intelligence modules</h2>
            <p className="section-subtitle">A modular roadmap around the complete auction lifecycle.</p>
          </div>
          <Link href="/reports" className="hidden text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:block">Open reporting centre →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { title: 'Prediction & demand', desc: 'Lot pricing, sale probability and reserve guidance.', href: '/forecast', icon: TrendingUp, status: 'Live' },
            { title: 'Market sentiment & risk', desc: 'External signals, volatility and downside alerts.', href: '/sentiment', icon: Gauge, status: 'Planned' },
            { title: 'Auction simulation', desc: 'Test reserve policies, demand and lot sequencing.', href: '/simulation', icon: Target, status: 'Planned' },
            { title: 'Grading & valuation', desc: 'Consistency checks, anomalies and valuation uplift.', href: '/grading', icon: Gem, status: 'Planned' },
            { title: 'Buyer intelligence', desc: 'Segments, buyer-lot matching and recommendations.', href: '/segmentation', icon: Users, status: 'Planned' },
            { title: 'Management reporting', desc: 'Committee, executive and post-sale decision packs.', href: '/reports', icon: FileBarChart, status: 'Live' },
          ].map((module) => (
            <Link key={module.title} href={module.href} className="group card flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                <module.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{module.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${module.status === 'Live' ? 'text-emerald-700' : 'text-slate-400'}`}>{module.status}</span>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{module.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
