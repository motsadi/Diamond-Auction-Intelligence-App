'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileBarChart,
  FileSpreadsheet,
  TrendingUp,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { useAuth } from '@/lib/auth';

const workflow = [
  {
    title: 'Prepare auction data',
    detail: 'Review the working lot file and update reserve assumptions.',
    href: '/workbook',
    icon: FileSpreadsheet,
    state: 'ready',
  },
  {
    title: 'Check data readiness',
    detail: 'Confirm completeness and usable pricing signals.',
    href: '/analysis',
    icon: Database,
    state: 'next',
  },
  {
    title: 'Run prediction & demand',
    detail: 'Estimate lot value, sale probability and reserve exceptions.',
    href: '/forecast',
    icon: TrendingUp,
    state: 'pending',
  },
  {
    title: 'Create decision report',
    detail: 'Prepare the concise pricing and management summary.',
    href: '/reports',
    icon: FileBarChart,
    state: 'pending',
  },
];

function DashboardContent() {
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0]?.split('.')[0] || 'auction team';

  return (
    <AppShell title="Overview" subtitle="ODC auction pricing workflow">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Simulated working cycle
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Good afternoon, <span className="capitalize">{firstName}</span>.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Follow one clear path from the auction workbook to model-supported reserve decisions and reporting.
              </p>
            </div>
            <Link href="/workbook" className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
              Open auction workbook <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['500', 'Auction lots', 'Simulated working dataset'],
            ['89.6%', 'Historical clearance', 'Observed in demo outcomes'],
            ['11.8', 'Average buyer viewings', 'Demand signal per lot'],
          ].map(([value, label, detail]) => (
            <div key={label} className="metric-card">
              <div className="text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
              <div className="mt-2 text-sm font-medium text-slate-700">{label}</div>
              <div className="mt-1 text-xs text-slate-400">{detail}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="section-title">Auction workflow</h2>
              <p className="section-subtitle">Complete each step in order; the model supports rather than replaces pricing judgement.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {workflow.map((step, index) => (
                <Link key={step.title} href={step.href} className="group flex items-center gap-4 px-6 py-5 transition hover:bg-slate-50">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    step.state === 'ready'
                      ? 'bg-emerald-100 text-emerald-800'
                      : step.state === 'next'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-500'
                  }`}>
                    {step.state === 'ready' ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                      <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{step.detail}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </Link>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h2 className="mt-5 section-title">Machine-learning role</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                The model estimates value and demand consistently across lots, identifies exceptions and measures its
                error on data it did not train on.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <div className="text-sm font-semibold text-amber-950">Demonstration boundary</div>
              <p className="mt-2 text-xs leading-5 text-amber-900/80">
                Current results use simulated records. Approved ODC auction history is required before operational pricing use.
              </p>
            </div>
          </aside>
        </section>
      </div>
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
