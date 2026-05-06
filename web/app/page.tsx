import Link from 'next/link';

export default function HomePage() {
  const pillars = [
    {
      title: 'Econometrics-informed auction models',
      desc: 'Estimate final price, sale probability, reserve impact, and demand sensitivity using auction covariates such as viewings, price index, carat, colour, and clarity.',
    },
    {
      title: 'Decision-ready forecasting',
      desc: 'Turn model outputs into reserve guidance, scenario comparisons, uncertainty bands, and downloadable auction reports for leadership review.',
    },
    {
      title: 'Explainable commercial insight',
      desc: 'Use feature importance, correlations, and performance metrics to show why a forecast moved and which market signals are driving value.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
              DAI
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">Diamond Auction Intelligence</div>
              <div className="text-xs text-gray-500">Forecasts, optimization, explainability</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-indigo-300/30 bg-white/10 px-4 py-2 text-sm text-indigo-100">
              Built for auction forecasting, reserve policy, and market intelligence
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Econometrics-informed diamond auction intelligence
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              A decision-support web app for Okavango Diamond Company teams to forecast auction outcomes, explain value
              drivers, test reserve strategies, and produce board-ready reports from trusted auction data.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth" className="btn-primary px-6 py-3 text-base">
                Get started
              </Link>
              <Link href="/dashboard" className="btn-secondary px-6 py-3 text-base">
                View dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-sm text-indigo-100">Auction forecast snapshot</div>
                <div className="text-2xl font-bold">Reserve decision cockpit</div>
              </div>
              <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm font-semibold text-emerald-100">
                Live
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ['Price R2', '0.91'],
                ['Sale probability', '84%'],
                ['Expected revenue', '+7.8%'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-300">{label}</div>
                  <div className="mt-2 text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {[
                'Demand elasticity and price index sensitivity',
                'Lot-level reserve recommendation',
                'SHAP explainability for commercial sign-off',
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="rounded-2xl border border-white/10 bg-white/95 p-6 text-slate-900 shadow-xl">
              <h3 className="text-lg font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}












